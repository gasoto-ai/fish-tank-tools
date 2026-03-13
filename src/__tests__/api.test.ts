/**
 * API route tests for fish-tank-tools.
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

import { GET as getTasks, POST as createTask } from "../app/api/tasks/route"
import { PATCH as updateTask, DELETE as deleteTask } from "../app/api/tasks/[id]/route"
import { GET as getNotes, POST as createNote } from "../app/api/notes/route"

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
    run: jest.fn().mockReturnValue({ lastInsertRowid: 42 }),
  }
}

// ─── Tasks ────────────────────────────────────────────────────────────────────

describe("GET /api/tasks", () => {
  beforeEach(() => jest.clearAllMocks())

  it("returns all tasks", async () => {
    const tasks = [
      { id: 1, title: "Build the app", status: "done", author: "Forge" },
      { id: 2, title: "Write tests", status: "in-progress", author: "Forge" },
    ]
    mockDb.prepare.mockReturnValue(makeStmt(tasks))

    const res = await getTasks()
    expect((res as { data: unknown }).data).toEqual(tasks)
  })
})

describe("POST /api/tasks", () => {
  beforeEach(() => jest.clearAllMocks())

  it("returns 400 when title is missing", async () => {
    const res = await createTask(makeRequest({ status: "todo" }) as never)
    expect((res as { status: number }).status).toBe(400)
  })

  it("creates a task and returns 201", async () => {
    const created = { id: 42, title: "Ship it", status: "todo", author: "Forge" }
    mockDb.prepare.mockReturnValue(makeStmt(created))

    const res = await createTask(makeRequest({ title: "Ship it" }) as never)
    expect((res as { status: number }).status).toBe(201)
  })

  it("defaults status to 'todo' when not provided", async () => {
    let capturedStatus: unknown
    mockDb.prepare.mockImplementation((query: string) => ({
      run: jest.fn().mockImplementation((...args: unknown[]) => {
        if (query.includes("INSERT INTO tasks")) {
          capturedStatus = args[2] // title, description, status, author
        }
        return { lastInsertRowid: 1 }
      }),
      get: jest.fn().mockReturnValue({ id: 1 }),
    }))

    await createTask(makeRequest({ title: "New task" }) as never)
    expect(capturedStatus).toBe("todo")
  })
})

describe("PATCH /api/tasks/[id]", () => {
  beforeEach(() => jest.clearAllMocks())

  it("returns 404 when task not found", async () => {
    mockDb.prepare.mockReturnValue(makeStmt(undefined))

    const res = await updateTask(
      makeRequest({ status: "done" }) as never,
      { params: Promise.resolve({ id: "99" }) }
    )
    expect((res as { status: number }).status).toBe(404)
  })

  it("updates and returns the task", async () => {
    const existing = { id: 1, title: "Task", status: "todo" }
    const updated = { ...existing, status: "done" }
    mockDb.prepare
      .mockReturnValueOnce(makeStmt(existing)) // SELECT for existence check
      .mockReturnValueOnce(makeStmt(null)) // UPDATE
      .mockReturnValueOnce(makeStmt(updated)) // SELECT after update

    const res = await updateTask(
      makeRequest({ status: "done" }) as never,
      { params: Promise.resolve({ id: "1" }) }
    )
    expect((res as { data: unknown }).data).toEqual(updated)
  })
})

describe("DELETE /api/tasks/[id]", () => {
  beforeEach(() => jest.clearAllMocks())

  it("returns 404 when task not found", async () => {
    mockDb.prepare.mockReturnValue(makeStmt(undefined))

    const res = await deleteTask(
      makeRequest() as never,
      { params: Promise.resolve({ id: "99" }) }
    )
    expect((res as { status: number }).status).toBe(404)
  })

  it("deletes task and returns success", async () => {
    mockDb.prepare
      .mockReturnValueOnce(makeStmt({ id: 1 })) // existence check
      .mockReturnValueOnce(makeStmt(null)) // DELETE

    const res = await deleteTask(
      makeRequest() as never,
      { params: Promise.resolve({ id: "1" }) }
    )
    expect((res as { data: { success: boolean } }).data.success).toBe(true)
  })
})

// ─── Notes ────────────────────────────────────────────────────────────────────

describe("GET /api/notes", () => {
  beforeEach(() => jest.clearAllMocks())

  it("returns all notes", async () => {
    const notes = [
      { id: 1, title: "Architecture decision", content: "Use SQLite", author: "Forge" },
    ]
    mockDb.prepare.mockReturnValue(makeStmt(notes))

    const res = await getNotes()
    expect((res as { data: unknown }).data).toEqual(notes)
  })
})

describe("POST /api/notes", () => {
  beforeEach(() => jest.clearAllMocks())

  it("returns 400 when title is missing", async () => {
    const res = await createNote(makeRequest({ content: "No title" }) as never)
    expect((res as { status: number }).status).toBe(400)
  })

  it("creates a note and returns 201", async () => {
    const created = { id: 42, title: "My note", content: "Content here", author: "Forge" }
    mockDb.prepare.mockReturnValue(makeStmt(created))

    const res = await createNote(makeRequest({ title: "My note", content: "Content here" }) as never)
    expect((res as { status: number }).status).toBe(201)
  })
})
