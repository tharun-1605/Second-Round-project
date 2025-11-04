import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { api } from '../api';
import io from 'socket.io-client';

export default function ResultsVisualization() {
  const [electionData, setElectionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { id } = useParams();

  useEffect(() => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
  const socket = io(backendUrl);

    const fetchElectionResults = async () => {
      try {
        const response = await api.get(`/elections/${id}/results`);
        setElectionData(response.data);
        setLoading(false);
      } catch (error) {
        setError('Failed to fetch election results');
        setLoading(false);
      }
    };

    fetchElectionResults();

    socket.on('connect', () => {
      socket.emit('join_election', id);
    });

    socket.on('vote_update', fetchElectionResults);

    return () => socket.disconnect();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  if (!electionData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">No results available</div>
      </div>
    );
  }

  const chartData = electionData.candidates.map(candidate => ({
    name: candidate.name,
    votes: candidate.voteCount,
    party: candidate.party
  }));

  const isElectionEnded = new Date() > new Date(electionData.endDate);
  const isFinalized = electionData.status === 'finalized';
  const showWinner = isFinalized && electionData.winner;

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="card">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            {electionData.title} - {isFinalized ? 'Final Results' : 'Live Results'}
          </h1>

          {showWinner && (
            <div className="mb-8 p-6 bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-xl">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-8 w-8 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-medium text-yellow-800">
                    🏆 Election Winner
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p className="font-semibold text-xl">{electionData.winner.candidate.name}</p>
                    <p className="text-lg">{electionData.winner.candidate.party}</p>
                    <p className="mt-1">{electionData.winner.votes} votes</p>
                    <p className="text-xs mt-1">
                      Finalized on {new Date(electionData.winner.finalizedAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {isElectionEnded && !isFinalized && (
            <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center">
                <svg className="h-5 w-5 text-blue-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <p className="text-blue-800 text-sm">
                  Election has ended. Results will be finalized shortly.
                </p>
              </div>
            </div>
          )}
          
          {/* Stats Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-indigo-50 p-4 rounded-lg">
              <h3 className="text-lg font-medium text-indigo-900">Total Votes</h3>
              <p className="text-2xl font-bold text-indigo-600">
                {electionData.candidates.reduce((sum, c) => sum + c.voteCount, 0)}
              </p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="text-lg font-medium text-green-900">Voter Turnout</h3>
              <p className="text-2xl font-bold text-green-600">
                {((electionData.totalVotes / electionData.totalVoters) * 100).toFixed(1)}%
              </p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="text-lg font-medium text-purple-900">Leading Candidate</h3>
              <p className="text-2xl font-bold text-purple-600">
                {chartData.reduce((prev, current) => 
                  (prev.votes > current.votes) ? prev : current
                ).name}
              </p>
            </div>
          </div>

          {/* Bar Chart */}
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="votes" fill="#4F46E5" name="Votes" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Detailed Results Table */}
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">Detailed Results</h2>
            <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Candidate
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Party
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Votes
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Percentage
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {chartData.map((candidate, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {candidate.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {candidate.party}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {candidate.votes}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {((candidate.votes / electionData.totalVotes) * 100).toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}