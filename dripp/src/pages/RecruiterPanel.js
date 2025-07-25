// src/pages/RecruiterPanel.js
import React, { useState, useEffect } from 'react';

const mockModels = [
  { id: 1, name: 'Anna Singh', category: 'Fashion', shortlisted: false },
  { id: 2, name: 'Priya Rao', category: 'Commercial', shortlisted: false },
  { id: 3, name: 'Sara Khan', category: 'Runway', shortlisted: false },
];

const RecruiterPanel = () => {
  const [models, setModels] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');

  useEffect(() => {
    // Replace this with an API call
    setModels(mockModels);
  }, []);

  const toggleShortlist = (id) => {
    setModels((prev) =>
      prev.map((m) => m.id === id ? { ...m, shortlisted: !m.shortlisted } : m)
    );
  };

  const filteredModels = models.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase()) &&
    (category ? m.category === category : true)
  );

  return (
    <div className="p-6 text-white bg-gray-900 min-h-screen">
      <h1 className="text-3xl font-bold text-pink-400 mb-4">Recruiter Panel</h1>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <input type="text" placeholder="Search by name"
          onChange={(e) => setSearch(e.target.value)}
          className="p-3 rounded bg-gray-800 w-full md:w-1/3" />
        <select onChange={(e) => setCategory(e.target.value)} className="p-3 rounded bg-gray-800 w-full md:w-1/3">
          <option value="">All Categories</option>
          <option value="Fashion">Fashion</option>
          <option value="Commercial">Commercial</option>
          <option value="Runway">Runway</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {filteredModels.map((model) => (
          <div key={model.id} className="bg-gray-800 p-4 rounded shadow-lg">
            <h2 className="text-xl font-semibold">{model.name}</h2>
            <p className="text-sm text-gray-300">{model.category}</p>
            <button
              onClick={() => toggleShortlist(model.id)}
              className={`mt-3 w-full py-2 rounded ${model.shortlisted ? 'bg-green-500' : 'bg-pink-500 hover:bg-pink-600'}`}
            >
              {model.shortlisted ? 'Shortlisted' : 'Shortlist'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecruiterPanel;
