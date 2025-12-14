'use client'

import { useState, useEffect } from 'react'
import { Conflux } from 'js-conflux-sdk'

const CONTRACT_ABI = [
  {
    "inputs": [{"internalType": "string", "name": "_title", "type": "string"}, {"internalType": "string", "name": "_description", "type": "string"}],
    "name": "createProposal",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "_proposalId", "type": "uint256"}, {"internalType": "bool", "name": "_vote", "type": "bool"}],
    "name": "vote",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "_proposalId", "type": "uint256"}],
    "name": "getProposal",
    "outputs": [
      {"internalType": "string", "name": "title", "type": "string"},
      {"internalType": "string", "name": "description", "type": "string"},
      {"internalType": "uint256", "name": "yesVotes", "type": "uint256"},
      {"internalType": "uint256", "name": "noVotes", "type": "uint256"},
      {"internalType": "bool", "name": "isActive", "type": "bool"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getProposalCount",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "_proposalId", "type": "uint256"}, {"internalType": "address", "name": "_voter", "type": "address"}],
    "name": "hasVoted",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  }
]

interface Proposal {
  id: number
  title: string
  description: string
  yesVotes: number
  noVotes: number
  isActive: boolean
  hasVoted: boolean
}

declare global {
  interface Window {
    conflux?: {
      enable: () => Promise<string[]>
      request: (args: { method: string; params?: any[] }) => Promise<any>
      sendTransaction: (tx: any) => Promise<string>
      getTransactionReceipt: (hash: string) => Promise<any>
    }
  }
}

export default function Home() {
  const [cfx, setCfx] = useState<Conflux | null>(null)
  const [account, setAccount] = useState<string>('')
  const [contract, setContract] = useState<any>(null)
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [loading, setLoading] = useState(false)
  const [contractAddress, setContractAddress] = useState('')
  const [newProposal, setNewProposal] = useState({ title: '', description: '' })

  useEffect(() => {
    const initConflux = () => {
      try {
        // Initialize with RPC URL first
        const conflux = new Conflux({
          url: process.env.NEXT_PUBLIC_CONFLUX_RPC_URL || 'https://test.confluxrpc.com',
          networkId: parseInt(process.env.NEXT_PUBLIC_NETWORK_ID || '1'),
        })
        setCfx(conflux)
      } catch (error) {
        console.error('Error initializing Conflux:', error)
      }
    }
    initConflux()
  }, [])

  const connectWallet = async () => {
    try {
      if (typeof window === 'undefined') {
        alert('Please open in a browser')
        return
      }

      // Check for Fluent Wallet
      if (window.conflux && window.conflux.enable) {
        try {
          const accounts = await window.conflux.enable()
          if (accounts && accounts.length > 0) {
            setAccount(accounts[0])
            // Update Conflux instance to use wallet provider
            if (cfx) {
              cfx.provider = window.conflux
            }
            alert('Wallet connected successfully!')
          }
        } catch (error: any) {
          console.error('Error enabling wallet:', error)
          alert(`Failed to connect wallet: ${error.message || 'User rejected the request'}`)
        }
      } else {
        alert('Please install Fluent Wallet extension!\n\nDownload from: https://fluentwallet.com')
      }
    } catch (error: any) {
      console.error('Error connecting wallet:', error)
      alert(`Failed to connect wallet: ${error.message || 'Unknown error'}`)
    }
  }

  const loadContract = async () => {
    if (!cfx || !contractAddress) {
      alert('Please enter contract address')
      return
    }
    
    // Normalize contract address - Conflux uses cfxtest: or cfx: format
    let normalizedAddress = contractAddress.trim()
    
    // Convert Conflux address format to hex if needed
    // Conflux addresses: cfxtest:acb5mv1vxyxxddtnzv7zamgk6s4md3wwhy8dgv9dxy
    // We need to keep it as is for Conflux SDK
    if (!normalizedAddress.startsWith('0x') && !normalizedAddress.startsWith('cfx') && !normalizedAddress.startsWith('CFX')) {
      alert('Invalid contract address format. Should start with 0x, cfx, or CFX')
      return
    }
    
    try {
      setLoading(true)
      console.log('Loading contract with address:', normalizedAddress)
      
      const contractInstance = cfx.Contract({
        abi: CONTRACT_ABI,
        address: normalizedAddress,
      })
      
      // Test if contract is accessible by calling a view function
      try {
        const count = await contractInstance.getProposalCount()
        console.log('Contract loaded successfully. Proposal count:', count.toString())
        setContract(contractInstance)
        await loadProposals(contractInstance)
        alert(`Contract loaded successfully! Found ${count.toString()} proposal(s).`)
      } catch (error: any) {
        console.error('Error testing contract:', error)
        // Still set the contract, might work for transactions
        setContract(contractInstance)
        alert(`Contract loaded but getProposalCount failed: ${error.message || 'Unknown error'}. You can still try to create proposals.`)
      }
    } catch (error: any) {
      console.error('Error loading contract:', error)
      alert(`Failed to load contract: ${error.message || 'Invalid contract address or network error'}`)
    } finally {
      setLoading(false)
    }
  }

  const loadProposals = async (contractInstance?: any) => {
    const contractToUse = contractInstance || contract
    if (!contractToUse) return

    try {
      setLoading(true)
      const count = await contractToUse.getProposalCount()
      const proposalCount = parseInt(count.toString())
      
      const proposalsData: Proposal[] = []
      for (let i = 0; i < proposalCount; i++) {
        const proposal = await contractToUse.getProposal(i)
        let voted = false
        if (account) {
          voted = await contractToUse.hasVoted(i, account)
        }
        proposalsData.push({
          id: i,
          title: proposal[0],
          description: proposal[1],
          yesVotes: parseInt(proposal[2].toString()),
          noVotes: parseInt(proposal[3].toString()),
          isActive: proposal[4],
          hasVoted: voted,
        })
      }
      setProposals(proposalsData)
    } catch (error) {
      console.error('Error loading proposals:', error)
    } finally {
      setLoading(false)
    }
  }

  const createProposal = async () => {
    if (!contract || !newProposal.title || !newProposal.description) {
      alert('Please fill in all fields')
      return
    }

    if (!account || !cfx) {
      alert('Please connect your wallet first')
      return
    }

    try {
      setLoading(true)
      // Use the wallet provider to send transaction
      const tx = contract.createProposal(newProposal.title, newProposal.description)
      const txHash = await tx.sendTransaction({ from: account })
      console.log('Transaction sent:', txHash)
      
      // Wait for transaction to be mined
      let receipt = null
      while (!receipt) {
        receipt = await cfx.getTransactionReceipt(txHash)
        if (!receipt) {
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      }
      
      console.log('Transaction receipt:', receipt)
      setNewProposal({ title: '', description: '' })
      await loadProposals()
      alert('Proposal created successfully!')
    } catch (error: any) {
      console.error('Error creating proposal:', error)
      alert(error.message || 'Failed to create proposal')
    } finally {
      setLoading(false)
    }
  }

  const vote = async (proposalId: number, voteValue: boolean) => {
    if (!contract || !account || !cfx) {
      alert('Please connect your wallet first')
      return
    }

    try {
      setLoading(true)
      // Use the wallet provider to send transaction
      const tx = contract.vote(proposalId, voteValue)
      const txHash = await tx.sendTransaction({ from: account })
      console.log('Transaction sent:', txHash)
      
      // Wait for transaction to be mined
      let receipt = null
      while (!receipt) {
        receipt = await cfx.getTransactionReceipt(txHash)
        if (!receipt) {
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      }
      
      console.log('Transaction receipt:', receipt)
      await loadProposals()
      alert(`Vote ${voteValue ? 'Yes' : 'No'} recorded!`)
    } catch (error: any) {
      console.error('Error voting:', error)
      alert(error.message || 'Failed to vote')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (contract) {
      loadProposals()
    }
  }, [contract, account])

  // Auto-load contract address from env if available
  useEffect(() => {
    const envAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS
    if (envAddress && !contractAddress && cfx) {
      setContractAddress(envAddress)
    }
  }, [cfx])

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Gas Sponsored Voting dApp
          </h1>
          <p className="text-xl text-gray-600">
            Vote on proposals on Conflux Network
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4">Wallet Connection</h2>
          {!account ? (
            <div>
              <button
                onClick={connectWallet}
                className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-semibold"
              >
                Connect Wallet
              </button>
              <p className="mt-4 text-gray-600">
                Install <a href="https://fluentwallet.com" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">Fluent Wallet</a>
              </p>
            </div>
          ) : (
            <p className="text-gray-700">
              <span className="font-semibold">Connected:</span> {account.substring(0, 10)}...{account.substring(account.length - 8)}
            </p>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4">Contract Address</h2>
          <div className="flex gap-4">
            <input
              type="text"
              value={contractAddress}
              onChange={(e) => setContractAddress(e.target.value.trim())}
              placeholder="0x..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
            <button
              onClick={loadContract}
              disabled={!contractAddress || !cfx || loading}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Loading...' : 'Load Contract'}
            </button>
          </div>
          {contract && (
            <p className="mt-2 text-sm text-green-600">✓ Contract loaded successfully</p>
          )}
        </div>

        {contract && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-2xl font-bold mb-4">Create Proposal</h2>
            <div className="space-y-4">
              <input
                type="text"
                value={newProposal.title}
                onChange={(e) => setNewProposal({ ...newProposal, title: e.target.value })}
                placeholder="Proposal Title"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
              <textarea
                value={newProposal.description}
                onChange={(e) => setNewProposal({ ...newProposal, description: e.target.value })}
                placeholder="Proposal Description"
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
              <button
                onClick={createProposal}
                disabled={loading}
                className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-semibold disabled:bg-gray-400"
              >
                {loading ? 'Creating...' : 'Create Proposal'}
              </button>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-6">Proposals</h2>
          {loading && !proposals.length ? (
            <p className="text-center text-gray-600">Loading...</p>
          ) : proposals.length === 0 ? (
            <p className="text-center text-gray-600">No proposals yet</p>
          ) : (
            <div className="space-y-6">
              {proposals.map((proposal) => (
                <div key={proposal.id} className="border border-gray-200 rounded-lg p-6">
                  <h3 className="text-xl font-bold mb-2">{proposal.title}</h3>
                  <p className="text-gray-600 mb-4">{proposal.description}</p>
                  
                  <div className="mb-4">
                    <div className="flex justify-between mb-2">
                      <span className="text-green-600 font-semibold">Yes: {proposal.yesVotes}</span>
                      <span className="text-red-600 font-semibold">No: {proposal.noVotes}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{
                          width: proposal.yesVotes + proposal.noVotes > 0
                            ? `${(proposal.yesVotes / (proposal.yesVotes + proposal.noVotes)) * 100}%`
                            : '0%'
                        }}
                      />
                    </div>
                  </div>

                  {proposal.isActive && (
                    <div className="flex gap-4">
                      {proposal.hasVoted ? (
                        <p className="text-gray-600 font-semibold">You have already voted</p>
                      ) : (
                        <>
                          <button
                            onClick={() => vote(proposal.id, true)}
                            disabled={loading || !account}
                            className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold disabled:bg-gray-400"
                          >
                            Vote Yes
                          </button>
                          <button
                            onClick={() => vote(proposal.id, false)}
                            disabled={loading || !account}
                            className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold disabled:bg-gray-400"
                          >
                            Vote No
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

