// export const migration = async (db: Db) => {
//   const datas = await db
//     .collection('calendarevent-sls')
//     .find({}, { projection: { _id: 0, updatedAt: 0 } })
//     .toArray();
//   // TODO insert many in supabse
//   const supabase = createClient(config.supabase.url, config.supabase.key);
//   try {
//     const { data, error } = await supabase
//       .from('events')
//       .insert(
//         datas.map(
//           (event) =>
//             ({
//               ...event,
//               departement: Number(event.departement),
//               active: typeof event.active === 'boolean' ? event.active : true,
//               lock: typeof event.active === 'boolean' ? event.active : false,
//             }) as Partial<Document>
//         )
//       )
//       .select();
//     console.log(data, error);
//   } catch (err) {
//     console.log(err);
//   }
// };
