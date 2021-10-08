import { File, FileVersion, Prisma, PrismaClient } from ".prisma/client"
import { generateId } from "../util/generators"
import { getBucket } from "../bucket/bucket"
import { CreateFileVersionInput } from "../fileVersion"

// Creates type 'CreateFileInput', making it self-update if model changes
const fileInputFields = Prisma.validator<Prisma.FileArgs>()({
  select: { name: true, directoryId: true },
})
export type CreateFileInput = Prisma.FileGetPayload<typeof fileInputFields> &
  Omit<CreateFileVersionInput, "fileId" | "key"> & {
    key?: FileVersion["key"]
  }

export async function createFileRecord(
  client: PrismaClient,
  file: CreateFileInput
): Promise<{ file: File; url: string }> {
  const { name, directoryId, mimeType, size, key: keyInput } = file
  const key = keyInput ?? (await generateId())
  const data = {
    name,
    directoryId,
    versions: {
      create: {
        name,
        key,
        mimeType,
        size,
      },
    },
  }
  const fileData = await client.file.create({ data, include: { versions: true } })
  const bucket = getBucket()
  const url = await bucket.getSignedUrl("put", key)
  return { file: fileData, url }
}

// get file
// move
// update
// delete

export async function getFile(client: PrismaClient, id: File["id"]): Promise<File | null> {
  return await client.file.findUnique({ where: { id }, include: { versions: true } })
}

export async function moveFile(
  client: PrismaClient,
  id: File["id"],
  directoryId: File["directoryId"]
): Promise<File> {
  return await client.file.update({
    where: { id },
    data: { directoryId },
    include: { versions: true },
  })
}

export async function renameFile(
  client: PrismaClient,
  id: File["id"],
  name: File["name"]
): Promise<File> {
  return await client.file.update({ where: { id }, data: { name }, include: { versions: true } })
}

export async function deleteFile(client: PrismaClient, id: File["id"]): Promise<boolean> {
  // When deleting file, also want to delete all fileVersion relations also
  //* COOL THING: Can chain on '.versions()' to return array of related versions from this file
  const versions = await client.file.findUnique({ where: { id } }).versions()

  // $transaction takes an array of transactions as Promises
  // if any item fails, entire thing is rolled back, error thrown
  await client.$transaction([
    client.fileVersion.deleteMany({ where: { fileId: id } }),
    client.file.delete({ where: { id } }),
  ])
  for (const version of versions) {
    await getBucket().deleteObject(version.key)
  }
  return true
}

export async function findFiles(client: PrismaClient, query: string): Promise<File[]> {
  return await client.file.findMany({
    where: {
      name: {
        contains: query,
        mode: "insensitive",
      },
    },
    orderBy: [{ name: "asc" }],
    include: { versions: true },
  })
}
