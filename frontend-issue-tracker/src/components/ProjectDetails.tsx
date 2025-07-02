import React, { useEffect, useState } from 'react';

interface Props {
  projectId: string;
}

const ProjectDetails: React.FC<Props> = ({ projectId }) => {
  const [showCustomers, setShowCustomers] = useState(true);
  const [showComponents, setShowComponents] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const res = await fetch(`/api/projects/${projectId}`);
      if (res.ok) {
        const data = await res.json();
        setShowCustomers(data.showCustomers !== false);
        setShowComponents(data.showComponents !== false);
      }
      setLoading(false);
    };
    fetchData();
  }, [projectId]);

  const handleSave = async () => {
    await fetch(`/api/projects/${projectId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ showCustomers, showComponents }),
    });
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="show-customers"
          checked={showCustomers}
          onChange={(e) => setShowCustomers(e.target.checked)}
        />
        <label htmlFor="show-customers">고객사 노출 여부</label>
      </div>
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="show-components"
          checked={showComponents}
          onChange={(e) => setShowComponents(e.target.checked)}
        />
        <label htmlFor="show-components">컴포넌트 노출 여부</label>
      </div>
      <button
        onClick={handleSave}
        className="px-4 py-2 bg-indigo-600 text-white rounded-md"
      >
        저장
      </button>
    </div>
  );
};

export default ProjectDetails;
