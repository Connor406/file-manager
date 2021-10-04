import { customAlphabet } from "nanoid/async"

const alphabet = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz"
const size = 11
export const generateId = customAlphabet(alphabet, size)
