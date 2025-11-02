import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../api';

export default function AdminDashboard() {
  const [elections, setElections] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [newElection, setNewElection] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: ''
  });
  const [newCandidate, setNewCandidate] = useState({
    name: '',
    party: '',
    position: ''
  });
  const [selectedElection, setSelectedElection] = useState(null);
  const [error, setError] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    fetchElections();
    fetchCandidates();
  }, []);

  const fetchElections = async () => {
    try {
      const response = await api.get('/elections');
      setElections(response.data);
    } catch (error) {
      setError('Failed to fetch elections');
    }
  };

  const fetchCandidates = async () => {
    try {
      const response = await api.get('/candidates');
      setCandidates(response.data);
    } catch (error) {
      setError('Failed to fetch candidates');
    }
  };

  const handleCreateElection = async (e) => {
    e.preventDefault();
    try {
      await api.post('/elections', newElection);
      setNewElection({ title: '', description: '', startDate: '', endDate: '' });
      fetchElections();
    } catch (error) {
      setError('Failed to create election');
    }
  };

  const handleCreateCandidate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/candidates', newCandidate);
      setNewCandidate({ name: '', party: '', position: '' });
      fetchCandidates();
    } catch (error) {
      setError('Failed to create candidate');
    }
  };

  const handleAddCandidateToElection = async (candidateId) => {
    if (!selectedElection) return;
    try {
      await api.post(`/elections/${selectedElection}/candidates`, { candidateId });
      fetchElections();
    } catch (error) {
      setError('Failed to add candidate to election');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          
          {error && (
            <div className="mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
              {error}
            </div>
          )}

          {/* Create Election Form */}
          <div className="mt-8 card">
            <h2 className="text-xl font-semibold mb-4">Create New Election</h2>
            <form onSubmit={handleCreateElection} className="space-y-4">
              <div>
                <input
                  type="text"
                  placeholder="Election Title"
                  value={newElection.title}
                  onChange={(e) => setNewElection({ ...newElection, title: e.target.value })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  required
                />
              </div>
              <div>
                <textarea
                  placeholder="Description"
                  value={newElection.description}
                  onChange={(e) => setNewElection({ ...newElection, description: e.target.value })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <input
                    type="datetime-local"
                    value={newElection.startDate}
                    onChange={(e) => setNewElection({ ...newElection, startDate: e.target.value })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    required
                  />
                </div>
                <div>
                  <input
                    type="datetime-local"
                    value={newElection.endDate}
                    onChange={(e) => setNewElection({ ...newElection, endDate: e.target.value })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Create Election
              </button>
            </form>
          </div>

          {/* Create Candidate Form */}
          <div className="mt-8 card">
            <h2 className="text-xl font-semibold mb-4">Add New Candidate</h2>
            <form onSubmit={handleCreateCandidate} className="space-y-4">
              <div>
                <input
                  type="text"
                  placeholder="Candidate Name"
                  value={newCandidate.name}
                  onChange={(e) => setNewCandidate({ ...newCandidate, name: e.target.value })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  required
                />
              </div>
              <div>
                <input
                  type="text"
                  placeholder="Party"
                  value={newCandidate.party}
                  onChange={(e) => setNewCandidate({ ...newCandidate, party: e.target.value })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  required
                />
              </div>
              <div>
                <input
                  type="text"
                  placeholder="Position"
                  value={newCandidate.position}
                  onChange={(e) => setNewCandidate({ ...newCandidate, position: e.target.value })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Add Candidate
              </button>
            </form>
          </div>

          {/* Elections List */}
          <div className="mt-8 card">
            <h2 className="text-xl font-semibold mb-4">Active Elections</h2>
            <div className="space-y-4">
              {elections.map((election) => (
                <div key={election._id} className="border rounded-lg p-4">
                  <h3 className="text-lg font-medium">{election.title}</h3>
                  <p className="text-sm text-gray-500">{election.description}</p>
                  <div className="mt-2">
                    <p>Start: {new Date(election.startDate).toLocaleString()}</p>
                    <p>End: {new Date(election.endDate).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}