import { FileVersion } from "@prisma/client"
import { Pagination } from "../app"
import { createModule, gql } from "graphql-modules"
import { prismaClient } from "../prisma"
import * as fileVersionService from "./service"

export const fileVersionModule = createModule({
  id: "fileVersion-module",
  dirname: __dirname,
  typeDefs: [
    gql`
      type FileVersion implements FileNode {
        id: ID!
        name: String!
        fileId: ID!
        mimeType: String!
        size: Int!
        key: String!
        createdAt: String!
        updatedAt: String!
        versions: [FileVersion]!
      }

      input CreateFileVersionInput {
        fileId: ID!
        name: String!
        mimeType: String!
        size: Int!
      }

      type CreateFileVersionResult {
        id: ID!
        name: String!
        fileId: ID!
        mimeType: String!
        size: Int!
        key: String!
        createdAt: String!
        updatedAt: String!
        url: String!
      }

      extend type Query {
        getAllFileVersions: [FileVersion]!
        requestFileDownload(key: String): String!
        getFileVersion(id: ID!): FileVersion
        getFileVersions(fileId: ID!, pagination: PaginationInput): [FileVersion]!
      }

      extend type Mutation {
        createFileVersion(input: CreateFileVersionInput!): CreateFileVersionResult!
      }
    `,
  ],
  resolvers: {
    Query: {
      getAllFileVersions: () => {
        return prismaClient().fileVersion.findMany()
      },
      requestFileDownload: async (_: unknown, { key }: { key: string }) => {
        return await fileVersionService.requestFileDownload(key)
      },
      getFileVersion: async (_: unknown, { id }: { id: string }) => {
        return await fileVersionService.getFileVersion(prismaClient(), id)
      },
      getFileVersions: async (
        _: unknown,
        { fileId, pagination }: { fileId: string; pagination?: Pagination }
      ) => {
        return await fileVersionService.getFileVersions(prismaClient(), fileId, pagination)
      },
    },
    Mutation: {
      createFileVersion: async (
        _: unknown,
        { input }: { input: fileVersionService.CreateFileVersionInput }
      ): Promise<FileVersion & { url: string }> => {
        return await fileVersionService.createFileVersionRecord(prismaClient(), input)
      },
    },
  },
})
