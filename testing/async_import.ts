// tslint:disable-next-line:no-default-export
export default async () => {
  const imported = await import("./file_to_import")
  // @ts-ignore
  console.log(">>>")
  console.log(imported.importedString)
}
