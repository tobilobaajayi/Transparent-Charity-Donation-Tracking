import { describe, it, expect, beforeEach } from "vitest"

// Mock the Clarity contract environment
const mockContractEnv = {
  blockHeight: 100,
  txSender: "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM",
  contractOwner: "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM",
}

// Mock contract state
let contractState = {
  totalDonations: 0,
  donors: new Map(),
  donationRecords: new Map(),
  donationCounter: 0,
}

// Mock contract functions
const donationManagement = {
  donate: (amount: number, note: string) => {
    const donor = mockContractEnv.txSender
    const donationId = contractState.donationCounter
    const currentDonorTotal = contractState.donors.get(donor) || 0
    const newDonorTotal = currentDonorTotal + amount
    
    // Update total donations
    contractState.totalDonations += amount
    
    // Update donor's total
    contractState.donors.set(donor, newDonorTotal)
    
    // Record donation details
    contractState.donationRecords.set(`${donor}-${donationId}`, {
      amount,
      timestamp: mockContractEnv.blockHeight,
      note,
    })
    
    // Increment donation counter
    contractState.donationCounter++
    
    return { success: true, value: donationId }
  },
  
  getTotalDonations: () => {
    return contractState.totalDonations
  },
  
  getDonorTotal: (donor: string) => {
    return contractState.donors.get(donor) || 0
  },
  
  getDonationDetails: (donor: string, donationId: number) => {
    return contractState.donationRecords.get(`${donor}-${donationId}`)
  },
}

describe("Donation Management Contract", () => {
  beforeEach(() => {
    // Reset contract state before each test
    contractState = {
      totalDonations: 0,
      donors: new Map(),
      donationRecords: new Map(),
      donationCounter: 0,
    }
  })
  
  it("should record a donation correctly", () => {
    const amount = 100
    const note = "Test donation"
    
    const result = donationManagement.donate(amount, note)
    
    expect(result.success).toBe(true)
    expect(result.value).toBe(0) // First donation ID should be 0
    expect(donationManagement.getTotalDonations()).toBe(amount)
    expect(donationManagement.getDonorTotal(mockContractEnv.txSender)).toBe(amount)
    
    const donationDetails = donationManagement.getDonationDetails(mockContractEnv.txSender, 0)
    expect(donationDetails).toBeDefined()
    expect(donationDetails?.amount).toBe(amount)
    expect(donationDetails?.note).toBe(note)
    expect(donationDetails?.timestamp).toBe(mockContractEnv.blockHeight)
  })
  
  it("should accumulate multiple donations correctly", () => {
    // First donation
    donationManagement.donate(100, "First donation")
    
    // Second donation
    donationManagement.donate(150, "Second donation")
    
    expect(donationManagement.getTotalDonations()).toBe(250)
    expect(donationManagement.getDonorTotal(mockContractEnv.txSender)).toBe(250)
    
    // Check both donation records
    const firstDonation = donationManagement.getDonationDetails(mockContractEnv.txSender, 0)
    const secondDonation = donationManagement.getDonationDetails(mockContractEnv.txSender, 1)
    
    expect(firstDonation?.amount).toBe(100)
    expect(secondDonation?.amount).toBe(150)
  })
})

