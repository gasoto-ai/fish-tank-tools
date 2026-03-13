/**
 * TDD tests for notes API routes.
 */

const mockDb = {
  prepare: jest.fn(),
}

jest.mock("@/lib/db", () => ({
  getDb: () => mockDb,
}))

jest.mock("next/server", () => ({
  NextResponse: {
    json: jest.fn().mockImplementation((data, init) => ({
      data,
      status: init?.status ?? 200,
    })),
  },
}))

import { GET as getNotes, POST as createNote } from "../../app/api/notes/route"
import { PATCH as updateNote, DELETE as deleteNote } from "../../app/api/notes/[id]/route"

function makeRequest(body?: unknown) {
  return {
    json: jest.fn().mockResolvedValue(body),
    nextUrl: new URL("http://localhost:3000"),
  } as unknown as Request
}

function makeStmt(returnValue: unknown) {
  return {
    all: jest.fn().mockReturnValue(returnValue),
    get: jest.fn().mockReturnValue(returnValue),
    run: jest.fn().mockReturnValue({ lastInsertRowid: 1 }),
  }
}

const note1 = { id: 1, title: "Architecture decision", content: "Use SQLite for everything", author: "Forge" }
const note2 = { id: 2, title: "Meeting notes", content: "Discussed TDD approach", author: "Ren" }

beforeEach(() => jest.clearAllMocks())

// ─── GET /api/notes ────────────────────────────────────────────────────────────

describe("GET /api/notes", () => {
  it("returns all notes", async () => {
    mockDb.prepare.mockReturnValue(makeStmt([note1, note2]))
    const res = await getNotes()
    expect((res as { data: unknown }).data).toEqual([note1, note2])
  })

  it("returns empty array when no notes", async () => {
    mockDb.prepare.mockReturnValue(makeStmt([]))
    const res = await getNotes()
    expect((res as { data: unknown[] }).data).toEqual([])
  })
})

// ─── POST /api/notes ───────────────────────────────────────────────────────────

describe("POST /api/notes", () => {
  it("returns 400 when title is missing", async () => {
    const res = await createNote(makeRequest({ content: "No title here" }) as never)
    expect((res as { status: number }).status).toBe(400)
  })

  it("returns 400 when title is empty string", async () => {
    const res = await createNote(makeRequest({ title: "", content: "Something" }) as never)
    expect((res as { status: number }).status).toBe(400)
  })

  it("creates a note and returns 201", async () => {
    mockDb.prepare.mockReturnValue(makeStmt(note1))
    const res = await createNote(makeRequest({ title: "New note", content: "Content" }) as never)
    expect((res as { status: number }).status).toBe(201)
  })

  it("defaults content to empty string when not provided", async () => {
    let capturedContent: unknown = "NOT_SET"
    mockDb.prepare.mockImplementation((query: string) => ({
      run: jest.fn().mockImplementation((...args: unknown[]) => {
        if (query.includes("INSERT INTO notes")) capturedContent = args[1]
        return { lastInsertRowid: 1 }
      }),
      get: jest.fn().mockReturnValue(note1),
    }))

    await createNote(makeRequest({ title: "No content" }) as never)
    // content should be empty string or null, not "NOT_SET"
    expect(capturedContent === "" || capturedContent === null || capturedContent === undefined).toBe(true)
  })
})

// ─── PATCH /api/notes/[id] ─────────────────────────────────────────────────────

describe("PATCH /api/notes/[id]", () => {
  it("returns 404 when note not found", async () => {
    mockDb.prepare.mockReturnValue(makeStmt(undefined))
    const res = await updateNote(
      makeRequest({ content: "Updated content" }) as never,
      { params: Promise.resolve({ id: "99" }) }
    )
    expect((res as { status: number }).status).toBe(404)
  })

  it("updates and returns the note", async () => {
    const updated = { ...note1, content: "Updated content" }
    mockDb.prepare
      .mockReturnValueOnce(makeStmt(note1))
      .mockReturnValueOnce(makeStmt(null))
      .mockReturnValueOnce(makeStmt(updated))

    const res = await updateNote(
      makeRequest({ content: "Updated content" }) as never,
      { params: Promise.resolve({ id: "1" }) }
    )
    expect((res as { data: unknown }).data).toEqual(updated)
  })
})

// ─── DELETE /api/notes/[id] ────────────────────────────────────────────────────

describe("DELETE /api/notes/[id]", () => {
  it("returns 404 when note not found", async () => {
    mockDb.prepare.mockReturnValue(makeStmt(undefined))
    const res = await deleteNote(
      makeRequest() as never,
      { params: Promise.resolve({ id: "99" }) }
    )
    expect((res as { status: number }).status).toBe(404)
  })

  it("deletes and returns success", async () => {
    mockDb.prepare
      .mockReturnValueOnce(makeStmt(note1))
      .mockReturnValueOnce(makeStmt(null))

    const res = await deleteNote(
      makeRequest() as never,
      { params: Promise.resolve({ id: "1" }) }
    )
    expect((res as { data: { success: boolean } }).data.success).toBe(true)
  })
})
