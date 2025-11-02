import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getElections } from '../api';

export default function Elections() {
  const [elections, setElections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchElections();
  }, []);

  const fetchElections = async () => {
    try {
      const res = await getElections();
      const data = res.data || [];
      // Filter active elections: either status === 'active' or within start/endDate
      const now = new Date();
      const active = data.filter((e) => {
        if (e.status === 'active') return true;
        const start = new Date(e.startDate);
        const end = new Date(e.endDate);
        return now >= start && now <= end;
      });
      setElections(active);
    } catch (err) {
      setError('Failed to load elections');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-indigo-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="card bg-white/60 backdrop-blur">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
              Current Elections
            </h1>
            <div className="flex items-center text-sm text-gray-500">
              <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-2"></span>
              Live Updates
            </div>
          </div>

          {error && (
            <div className="mb-6 text-red-600 bg-red-50 rounded-lg p-4 text-sm">{error}</div>
          )}

          {elections.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-lg mb-2">No active elections</div>
              <p className="text-sm text-gray-500">Check back later for upcoming elections</p>
            </div>
          ) : (
            <div className="space-y-4">
              {elections.map((election) => (
                <div key={election._id} className="p-6 border border-gray-100 rounded-xl flex items-center justify-between hover:shadow-lg transition-all duration-200 bg-white">
                  <div className="flex-1 min-w-0 pr-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-1">{election.title}</h2>
                    <p className="text-gray-600 mb-2 line-clamp-2">{election.description}</p>
                    <div className="flex items-center text-sm text-gray-400 gap-3">
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Starts: {new Date(election.startDate).toLocaleString()}
                      </div>
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Ends: {new Date(election.endDate).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => navigate(`/elections/${election._id}/vote`)}
                      className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-lg font-medium shadow-sm hover:shadow-indigo-100 hover:shadow-lg transition-all duration-200"
                    >
                      Vote Now
                    </button>
                    <Link 
                      to={`/elections/${election._id}/results`} 
                      className="px-5 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:border-indigo-100 hover:bg-indigo-50 hover:text-indigo-600 transition-all duration-200"
                    >
                      View Results
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
