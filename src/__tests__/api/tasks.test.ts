/**
 * TDD tests for tasks API routes.
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

import { GET as getTasks, POST as createTask } from "../../app/api/tasks/route"
import { PATCH as updateTask, DELETE as deleteTask } from "../../app/api/tasks/[id]/route"

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

const task1 = { id: 1, title: "Build the app", status: "done", author: "Forge", description: null }
const task2 = { id: 2, title: "Write tests", status: "in-progress", author: "Forge", description: null }

beforeEach(() => jest.clearAllMocks())

// ─── GET /api/tasks ────────────────────────────────────────────────────────────

describe("GET /api/tasks", () => {
  it("returns all tasks", async () => {
    mockDb.prepare.mockReturnValue(makeStmt([task1, task2]))
    const res = await getTasks()
    expect((res as { data: unknown }).data).toEqual([task1, task2])
  })

  it("returns empty array when no tasks exist", async () => {
    mockDb.prepare.mockReturnValue(makeStmt([]))
    const res = await getTasks()
    expect((res as { data: unknown[] }).data).toEqual([])
  })
})

// ─── POST /api/tasks ───────────────────────────────────────────────────────────

describe("POST /api/tasks", () => {
  it("returns 400 when title is missing", async () => {
    const res = await createTask(makeRequest({ status: "todo" }) as never)
    expect((res as { status: number }).status).toBe(400)
  })

  it("returns 400 when title is empty string", async () => {
    const res = await createTask(makeRequest({ title: "" }) as never)
    expect((res as { status: number }).status).toBe(400)
  })

  it("creates a task and returns 201", async () => {
    mockDb.prepare.mockReturnValue(makeStmt(task1))
    const res = await createTask(makeRequest({ title: "Ship it" }) as never)
    expect((res as { status: number }).status).toBe(201)
  })

  it("defaults status to 'todo' when not provided", async () => {
    let capturedStatus: unknown
    mockDb.prepare.mockImplementation((query: string) => ({
      run: jest.fn().mockImplementation((...args: unknown[]) => {
        if (query.includes("INSERT INTO tasks")) capturedStatus = args[2]
        return { lastInsertRowid: 1 }
      }),
      get: jest.fn().mockReturnValue(task1),
    }))

    await createTask(makeRequest({ title: "New task" }) as never)
    expect(capturedStatus).toBe("todo")
  })

  it("accepts explicit status override", async () => {
    let capturedStatus: unknown
    mockDb.prepare.mockImplementation((query: string) => ({
      run: jest.fn().mockImplementation((...args: unknown[]) => {
        if (query.includes("INSERT INTO tasks")) capturedStatus = args[2]
        return { lastInsertRowid: 1 }
      }),
      get: jest.fn().mockReturnValue(task1),
    }))

    await createTask(makeRequest({ title: "In flight", status: "in-progress" }) as never)
    expect(capturedStatus).toBe("in-progress")
  })
})

// ─── PATCH /api/tasks/[id] ─────────────────────────────────────────────────────

describe("PATCH /api/tasks/[id]", () => {
  it("returns 404 when task not found", async () => {
    mockDb.prepare.mockReturnValue(makeStmt(undefined))
    const res = await updateTask(
      makeRequest({ status: "done" }) as never,
      { params: Promise.resolve({ id: "99" }) }
    )
    expect((res as { status: number }).status).toBe(404)
  })

  it("updates and returns the task", async () => {
    const updated = { ...task1, status: "done" }
    mockDb.prepare
      .mockReturnValueOnce(makeStmt(task1))  // existence check
      .mockReturnValueOnce(makeStmt(null))   // UPDATE
      .mockReturnValueOnce(makeStmt(updated)) // SELECT after update

    const res = await updateTask(
      makeRequest({ status: "done" }) as never,
      { params: Promise.resolve({ id: "1" }) }
    )
    expect((res as { data: unknown }).data).toEqual(updated)
  })

  it("uses COALESCE so partial updates don't wipe other fields", async () => {
    mockDb.prepare
      .mockReturnValueOnce(makeStmt(task1))
      .mockReturnValueOnce(makeStmt(null))
      .mockReturnValueOnce(makeStmt(task1))

    await updateTask(
      makeRequest({ status: "done" }) as never,
      { params: Promise.resolve({ id: "1" }) }
    )

    const updateQuery = mockDb.prepare.mock.calls[1][0] as string
    expect(updateQuery).toContain("COALESCE")
  })
})

// ─── DELETE /api/tasks/[id] ────────────────────────────────────────────────────

describe("DELETE /api/tasks/[id]", () => {
  it("returns 404 when task not found", async () => {
    mockDb.prepare.mockReturnValue(makeStmt(undefined))
    const res = await deleteTask(
      makeRequest() as never,
      { params: Promise.resolve({ id: "99" }) }
    )
    expect((res as { status: number }).status).toBe(404)
  })

  it("deletes and returns success", async () => {
    mockDb.prepare
      .mockReturnValueOnce(makeStmt(task1))  // existence check
      .mockReturnValueOnce(makeStmt(null))   // DELETE

    const res = await deleteTask(
      makeRequest() as never,
      { params: Promise.resolve({ id: "1" }) }
    )
    expect((res as { data: { success: boolean } }).data.success).toBe(true)
  })
})
