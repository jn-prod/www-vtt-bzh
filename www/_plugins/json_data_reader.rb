require "json"

# Jekyll uses safe_yaml (incompatible with Psych 5.x / Ruby 4.0) for all _data/ files.
# This plugin patches the data reader to use Ruby's native JSON.parse for .json files.
module JsonDataReaderPatch
  def read_data_file(path)
    if File.extname(path).downcase == ".json"
      JSON.parse(File.read(path, encoding: "utf-8"))
    else
      super
    end
  end
end

Jekyll::DataReader.prepend(JsonDataReaderPatch)
