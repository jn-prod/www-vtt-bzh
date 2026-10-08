# frozen_string_literal: true

require "cgi"
require "fileutils"
require "json"
require "net/http"
require "rexml/document"
require "rexml/xpath"
require "tempfile"
require "time"
require "uri"

module LaSortieFeed
  FEED_URL = "https://www.nicolasjouanno.com/la-sortie/feed.xml"
  SITE_HOST = "www.nicolasjouanno.com"
  MEDIA_NAMESPACE = "http://search.yahoo.com/mrss/"
  TRACKING = {
    "utm_source" => "vtt-bzh",
    "utm_medium" => "site",
    "utm_campaign" => "rando-bretagne",
    "utm_content" => "latest-issue"
  }.freeze
  FALLBACK = {
    "title" => "La Sortie",
    "description" => "Des chemins, des voix et des idées pour découvrir la Bretagne.",
    "url" => "https://www.nicolasjouanno.com/la-sortie/?#{URI.encode_www_form(TRACKING)}",
    "image_url" => nil,
    "image_alt" => nil,
    "published_at" => nil,
    "source" => "fallback"
  }.freeze

  module_function

  def parse(xml)
    document = REXML::Document.new(xml)
    item = REXML::XPath.first(document, "/rss/channel/item")
    raise "le flux ne contient aucune édition" unless item

    media = REXML::XPath.first(item, "./media:content", { "media" => MEDIA_NAMESPACE })
    media_description = REXML::XPath.first(
      item,
      "./media:content/media:description",
      { "media" => MEDIA_NAMESPACE }
    )

    {
      "title" => required_text(item.elements["title"], "title"),
      "description" => summary(item.elements["description"]&.text),
      "url" => tracked_url(required_text(item.elements["link"], "link")),
      "image_url" => media ? trusted_url(media.attributes["url"]).to_s : nil,
      "image_alt" => media_description ? clean_text(media_description.text) : nil,
      "published_at" => published_at(item.elements["pubDate"]&.text),
      "source" => "rss"
    }
  rescue REXML::ParseException => e
    raise "XML invalide : #{e.message}"
  end

  def read_feed
    local_feed = ENV["LA_SORTIE_FEED_FILE"]
    return File.read(local_feed, encoding: "utf-8") if local_feed && !local_feed.empty?

    uri = URI(FEED_URL)
    request = Net::HTTP::Get.new(uri)
    request["User-Agent"] = "vtt.bzh build"
    response = Net::HTTP.start(
      uri.hostname,
      uri.port,
      use_ssl: true,
      open_timeout: 5,
      read_timeout: 10
    ) { |http| http.request(request) }
    raise "HTTP #{response.code}" unless response.is_a?(Net::HTTPSuccess)

    response.body
  end

  def write(data, output)
    directory = File.dirname(output)
    FileUtils.mkdir_p(directory)
    Tempfile.create(["la-sortie", ".json"], directory) do |file|
      file.write("#{JSON.pretty_generate(data)}\n")
      file.flush
      File.rename(file.path, output)
    end
  end

  def required_text(element, field)
    value = clean_text(element&.text)
    raise "champ #{field} absent" if value.empty?

    value
  end

  def summary(html)
    paragraphs = html.to_s.scan(%r{<p\b[^>]*>(.*?)</p>}mi).flatten.map { |paragraph| clean_html(paragraph) }
    value = paragraphs.find { |paragraph| !paragraph.empty? && !paragraph.start_with?("Initialement publié") }
    value ||= clean_html(html)
    raise "description absente" if value.empty?

    value
  end

  def clean_html(value)
    clean_text(value.to_s.gsub(%r{<[^>]+>}m, " "))
  end

  def clean_text(value)
    CGI.unescapeHTML(value.to_s).gsub(/\s+/, " ").strip
  end

  def trusted_url(value)
    uri = URI.parse(clean_text(value))
    unless uri.is_a?(URI::HTTPS) && uri.host == SITE_HOST
      raise "URL hors du domaine attendu"
    end

    uri
  rescue URI::InvalidURIError
    raise "URL invalide"
  end

  def tracked_url(value)
    uri = trusted_url(value)
    query = URI.decode_www_form(uri.query.to_s).reject { |key, _value| key.start_with?("utm_") }
    uri.query = URI.encode_www_form(query + TRACKING.to_a)
    uri.to_s
  end

  def published_at(value)
    return nil if value.to_s.strip.empty?

    Time.rfc2822(value).utc.iso8601
  rescue ArgumentError
    nil
  end
end

if $PROGRAM_NAME == __FILE__
  output = ENV.fetch(
    "LA_SORTIE_OUTPUT",
    File.expand_path("../www/_data/newsletters/latest.json", __dir__)
  )

  data = begin
    LaSortieFeed.parse(LaSortieFeed.read_feed)
  rescue StandardError => e
    warn("[la-sortie] flux indisponible (#{e.message}) : utilisation du repli statique")
    LaSortieFeed::FALLBACK
  end

  LaSortieFeed.write(data, output)
  puts("[la-sortie] carte générée depuis #{data.fetch("source")} : #{output}")
end
