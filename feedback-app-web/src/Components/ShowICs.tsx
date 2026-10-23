import { useState, useEffect } from 'react';

type IC = {
  IC_id: number;
  name: string;
  title: string;
  entries: number;
};

function ObtainICs() {
  const [ics, setIcs] = useState<IC[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('https://feedback-api-latest-moe8.onrender.com/ics')
      .then((response) => response.json())
      .then((res) => {
        setIcs(Array.isArray(res?.data) ? res.data : []);
        setLoading(false);
        console.log("Retrieved data:", res);
      })
      .catch((error) => {
        console.error("Error retrieving data:", error);
        setLoading(false);
      });
  }, []);

   const getBadgeColor = (entries: number) => {
    switch (entries) {
      case 1: return '#d31c37';
      case 2: return '#e65100';
      case 3: return '#e07b00';
      case 4: return '#55a613';
      case 5: return '#1b7800';
      default: return '#1318a6';
    }
  };

  if (loading) {
    return <p>Loading data...</p>;
  }

  if (ics.length === 0) {
    return (
      <div className="show-ics-empty">
        <i className="fa-solid fa-user-group"></i>
        <p>You don't have any Individual Contributors assigned yet. The Director assigns ICs to each manager.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h2>Your Team</h2>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
        {ics.map((item) => (
          <div 
            key={item.IC_id} 
            style={{ 
              display: 'flex', 
              border: '1px solid #ccc', 
              borderRadius: '12px', 
              padding: '20px', 
              minWidth: '280px',
              flex: '1',
              alignItems: 'center',
            }}
          >
            <div 
              style={{ 
                width: '45px', 
                height: '45px', 
                borderRadius: '50%', 
                backgroundColor: '#ddd', 
                marginRight: '15px',
              }} 
            />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <h3 style={{ margin: 0, fontSize: '18px' }}>{item.name}</h3>
              <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>{item.title}</p>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '5px' }}>
                <span 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    width: '24px', 
                    height: '24px', 
                    borderRadius: '50%', 
                    backgroundColor: getBadgeColor(item.entries),
                    color: 'white', 
                    fontSize: '12px'
                  }}
                >
                  {item.entries}
                </span>
                <span style={{ fontSize: '14px', color: '#444' }}>{item.entries} entries</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ObtainICs;
