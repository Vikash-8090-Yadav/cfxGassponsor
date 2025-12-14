// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract GasSponsoredVoting {
    struct Proposal {
        string title;
        string description;
        uint256 yesVotes;
        uint256 noVotes;
        bool isActive;
        mapping(address => bool) hasVoted;
    }

    address public owner;
    Proposal[] public proposals;

    event ProposalCreated(uint256 indexed proposalId, string title);
    event VoteCast(uint256 indexed proposalId, address indexed voter, bool vote);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function createProposal(string memory _title, string memory _description) public onlyOwner {
        Proposal storage newProposal = proposals.push();
        newProposal.title = _title;
        newProposal.description = _description;
        newProposal.yesVotes = 0;
        newProposal.noVotes = 0;
        newProposal.isActive = true;

        emit ProposalCreated(proposals.length - 1, _title);
    }

    function vote(uint256 _proposalId, bool _vote) public {
        require(_proposalId < proposals.length, "Invalid proposal ID");
        Proposal storage proposal = proposals[_proposalId];
        require(proposal.isActive, "Proposal is not active");
        require(!proposal.hasVoted[msg.sender], "Already voted");

        proposal.hasVoted[msg.sender] = true;

        if (_vote) {
            proposal.yesVotes++;
        } else {
            proposal.noVotes++;
        }

        emit VoteCast(_proposalId, msg.sender, _vote);
    }

    function getProposal(uint256 _proposalId) public view returns (
        string memory title,
        string memory description,
        uint256 yesVotes,
        uint256 noVotes,
        bool isActive
    ) {
        require(_proposalId < proposals.length, "Invalid proposal ID");
        Proposal storage proposal = proposals[_proposalId];
        return (
            proposal.title,
            proposal.description,
            proposal.yesVotes,
            proposal.noVotes,
            proposal.isActive
        );
    }

    function hasVoted(uint256 _proposalId, address _voter) public view returns (bool) {
        require(_proposalId < proposals.length, "Invalid proposal ID");
        return proposals[_proposalId].hasVoted[_voter];
    }

    function getProposalCount() public view returns (uint256) {
        return proposals.length;
    }

    function closeProposal(uint256 _proposalId) public onlyOwner {
        require(_proposalId < proposals.length, "Invalid proposal ID");
        proposals[_proposalId].isActive = false;
    }
}

