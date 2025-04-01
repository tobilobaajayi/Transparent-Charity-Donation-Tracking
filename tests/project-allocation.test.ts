import { describe, it, expect, beforeEach } from "vitest"

// Mock the Clarity contract environment
const mockContractEnv = {
  blockHeight: 100,
  txSender: "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM",
  contractOwner: "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM",
}

// Mock contract state
let contractState = {
  projects: new Map(),
  projectCounter: 0,
  allocations: new Map(),
  allocationCounter: 0,
}

// Mock contract functions
const projectAllocation = {
  createProject: (name: string, description: string) => {
    if (mockContractEnv.txSender !== mockContractEnv.contractOwner) {
      return { success: false, error: 403 }
    }
    
    const projectId = contractState.projectCounter
    
    contractState.projects.set(projectId, {
      name,
      description,
      active: true,
      totalAllocated: 0,
      totalSpent: 0,
    })
    
    contractState.projectCounter++
    
    return { success: true, value: projectId }
  },
  
  allocateFunds: (projectId: number, amount: number) => {
    if (mockContractEnv.txSender !== mockContractEnv.contractOwner) {
      return { success: false, error: 403 }
    }
    
    const project = contractState.projects.get(projectId)
    if (!project) {
      return { success: false, error: 404 }
    }
    
    const allocationId = contractState.allocationCounter
    const newTotalAllocated = project.totalAllocated + amount
    
    // Update project's total allocated
    contractState.projects.set(projectId, {
      ...project,
      totalAllocated: newTotalAllocated,
    })
    
    // Record allocation
    contractState.allocations.set(allocationId, {
      projectId,
      amount,
      timestamp: mockContractEnv.blockHeight,
    })
    
    contractState.allocationCounter++
    
    return { success: true, value: allocationId }
  },
  
  getProject: (projectId: number) => {
    return contractState.projects.get(projectId)
  },
  
  getAllocation: (allocationId: number) => {
    return contractState.allocations.get(allocationId)
  },
}

describe("Project Allocation Contract", () => {
  beforeEach(() => {
    // Reset contract state before each test
    contractState = {
      projects: new Map(),
      projectCounter: 0,
      allocations: new Map(),
      allocationCounter: 0,
    }
  })
  
  it("should create a project correctly", () => {
    const name = "Clean Water Initiative"
    const description = "Providing clean water to rural communities"
    
    const result = projectAllocation.createProject(name, description)
    
    expect(result.success).toBe(true)
    expect(result.value).toBe(0) // First project ID should be 0
    
    const project = projectAllocation.getProject(0)
    expect(project).toBeDefined()
    expect(project?.name).toBe(name)
    expect(project?.description).toBe(description)
    expect(project?.active).toBe(true)
    expect(project?.totalAllocated).toBe(0)
  })
  
  it("should allocate funds to a project correctly", () => {
    // First create a project
    projectAllocation.createProject("Education Fund", "Supporting education in underserved areas")
    
    // Then allocate funds
    const amount = 5000
    const result = projectAllocation.allocateFunds(0, amount)
    
    expect(result.success).toBe(true)
    expect(result.value).toBe(0) // First allocation ID should be 0
    
    // Check project updated correctly
    const project = projectAllocation.getProject(0)
    expect(project?.totalAllocated).toBe(amount)
    
    // Check allocation record
    const allocation = projectAllocation.getAllocation(0)
    expect(allocation).toBeDefined()
    expect(allocation?.projectId).toBe(0)
    expect(allocation?.amount).toBe(amount)
    expect(allocation?.timestamp).toBe(mockContractEnv.blockHeight)
  })
  
  it("should fail to allocate funds to non-existent project", () => {
    const result = projectAllocation.allocateFunds(999, 1000)
    
    expect(result.success).toBe(false)
    expect(result.error).toBe(404)
  })
})

