import { useState, useEffect } from 'react';
import { collection, query, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Trophy, Star, Award, TrendingUp } from 'lucide-react';

export default function Leaderboard() {
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWorkers();
  }, []);

  async function fetchWorkers() {
    try {
      // In a real app, this would fetch from a workers collection
      // For demo purposes, showing sample data
      const sampleWorkers = [
        {
          id: 1,
          name: 'Rajesh Kumar',
          tasksCompleted: 145,
          rating: 4.8,
          rank: 1,
          efficiency: 95
        },
        {
          id: 2,
          name: 'Amit Sharma',
          tasksCompleted: 132,
          rating: 4.7,
          rank: 2,
          efficiency: 92
        },
        {
          id: 3,
          name: 'Priya Patel',
          tasksCompleted: 128,
          rating: 4.9,
          rank: 3,
          efficiency: 94
        },
        {
          id: 4,
          name: 'Suresh Yadav',
          tasksCompleted: 119,
          rating: 4.6,
          rank: 4,
          efficiency: 89
        },
        {
          id: 5,
          name: 'Meena Singh',
          tasksCompleted: 107,
          rating: 4.7,
          rank: 5,
          efficiency: 91
        },
        {
          id: 6,
          name: 'Vikram Reddy',
          tasksCompleted: 98,
          rating: 4.5,
          rank: 6,
          efficiency: 87
        },
        {
          id: 7,
          name: 'Sunita Desai',
          tasksCompleted: 89,
          rating: 4.6,
          rank: 7,
          efficiency: 88
        },
        {
          id: 8,
          name: 'Anil Verma',
          tasksCompleted: 76,
          rating: 4.4,
          rank: 8,
          efficiency: 85
        }
      ];

      setWorkers(sampleWorkers);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching workers:', error);
      setLoading(false);
    }
  }

  const getMedalColor = (rank) => {
    if (rank === 1) return '#ffd700';
    if (rank === 2) return '#c0c0c0';
    if (rank === 3) return '#cd7f32';
    return '#667eea';
  };

  const getMedalIcon = (rank) => {
    if (rank <= 3) return <Trophy size={24} style={{ color: getMedalColor(rank) }} />;
    return <Award size={24} style={{ color: getMedalColor(rank) }} />;
  };

  if (loading) {
    return <div className="leaderboard-container"><div className="loading">Loading leaderboard...</div></div>;
  }

  return (
    <div className="leaderboard-container">
      <div className="leaderboard-header">
        <Trophy size={40} />
        <div>
          <h1>Worker Leaderboard</h1>
          <p>Top-performing civic workers based on completed tasks and ratings</p>
        </div>
      </div>

      <div className="stats-overview">
        <div className="stat-box">
          <TrendingUp size={32} />
          <div>
            <h3>{workers.length}</h3>
            <p>Active Workers</p>
          </div>
        </div>
        <div className="stat-box">
          <Star size={32} />
          <div>
            <h3>{workers.reduce((sum, w) => sum + w.tasksCompleted, 0)}</h3>
            <p>Total Tasks Completed</p>
          </div>
        </div>
        <div className="stat-box">
          <Award size={32} />
          <div>
            <h3>{(workers.reduce((sum, w) => sum + w.rating, 0) / workers.length).toFixed(1)}</h3>
            <p>Average Rating</p>
          </div>
        </div>
      </div>

      <div className="podium">
        {workers.slice(0, 3).map((worker) => (
          <div key={worker.id} className={`podium-place rank-${worker.rank}`}>
            <div className="podium-icon">{getMedalIcon(worker.rank)}</div>
            <div className="podium-avatar">{worker.name.charAt(0)}</div>
            <h3>{worker.name}</h3>
            <p className="podium-tasks">{worker.tasksCompleted} tasks</p>
            <div className="podium-rating">
              <Star size={16} fill="gold" color="gold" />
              {worker.rating}
            </div>
          </div>
        ))}
      </div>

      <div className="rankings-table">
        <h2>Complete Rankings</h2>
        <table>
          <thead>
            <tr>
              <th>Rank</th>
              <th>Worker</th>
              <th>Tasks Completed</th>
              <th>Rating</th>
              <th>Efficiency</th>
            </tr>
          </thead>
          <tbody>
            {workers.map((worker) => (
              <tr key={worker.id} className={worker.rank <= 3 ? 'highlight' : ''}>
                <td>
                  <div className="rank-cell">
                    {getMedalIcon(worker.rank)}
                    <span>#{worker.rank}</span>
                  </div>
                </td>
                <td>
                  <div className="worker-cell">
                    <div className="worker-avatar">{worker.name.charAt(0)}</div>
                    <span>{worker.name}</span>
                  </div>
                </td>
                <td><strong>{worker.tasksCompleted}</strong></td>
                <td>
                  <div className="rating-cell">
                    <Star size={16} fill="gold" color="gold" />
                    {worker.rating}
                  </div>
                </td>
                <td>
                  <div className="efficiency-bar">
                    <div className="efficiency-fill" style={{ width: `${worker.efficiency}%` }}>
                      {worker.efficiency}%
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
