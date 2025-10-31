import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../api';
import io from 'socket.io-client';

export default function VotingInterface() {
  const [election, setElection] = useState(null);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const { id } = useParams();
  const { user } = useAuth();

  useEffect(() => {
    const socket = io(process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000');
    
    fetchElection();
    checkVoteStatus();

    socket.on('connect', () => {
      socket.emit('join_election', id);
    });

    socket.on('vote_update', () => {
      fetchElection();
    });

    return () => socket.disconnect();
  }, [id]);

  const fetchElection = async () => {
    try {
      const response = await api.get(`/elections/${id}`);
      setElection(response.data);
    } catch (error) {
      setError('Failed to fetch election details');
    } finally {
      setLoading(false);
    }
  };

  const checkVoteStatus = async () => {
    try {
      const response = await api.get(`/votes/check/${id}`);
      setHasVoted(response.data.hasVoted);
    } catch (error) {
      console.error('Failed to check vote status');
    }
  };

  const handleVote = async () => {
    if (!selectedCandidate) {
      setError('Please select a candidate');
      return;
    }

    try {
      await api.post('/votes', {
        electionId: id,
        candidateId: selectedCandidate
      });
      setHasVoted(true);
      fetchElection(); // Refresh election data
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to cast vote');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!election) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-600">Election not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">{election.title}</h1>
          <p className="text-gray-600 mb-8">{election.description}</p>

          {error && (
            <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
              {error}
            </div>
          )}

          {hasVoted ? (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative">
              Thank you for voting! Your vote has been recorded.
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {election.candidates.map((candidate) => (
                  <div
                    key={candidate._id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors duration-200 ${
                      selectedCandidate === candidate._id
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 hover:border-indigo-300'
                    }`}
                    onClick={() => setSelectedCandidate(candidate._id)}
                  >
                    <div className="flex items-center">
                      <input
                        type="radio"
                        name="candidate"
                        value={candidate._id}
                        checked={selectedCandidate === candidate._id}
                        onChange={() => setSelectedCandidate(candidate._id)}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                      />
                      <div className="ml-4">
                        <h3 className="text-lg font-medium">{candidate.name}</h3>
                        <p className="text-sm text-gray-500">{candidate.party}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8">
                <button
                  onClick={handleVote}
                  disabled={!selectedCandidate}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Cast Your Vote
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}