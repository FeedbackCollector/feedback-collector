import { useState, useEffect } from 'react';


type IC = {
  id: number;
  name: string;
};


function ObtainICs() {
  const [ics, setIcs] = useState<IC[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('AcaVaElEndpoint')                    // COLOCAR ENDPOINT
      .then((response) => response.json())
      .then((data) => {
        setIcs(data ?? []);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error retrieving data:", error);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <p>Loading data...</p>;
  }

  if (ics.length === 0) {
    return (
      <div>
        <i className="fa-solid fa-user-group"></i>
        <p>You don't have any Individual Contributors assigned yet. The Director assigns ICs to each manager.</p>
      </div>
    );
  }

  return (
    <ul>
      {ics.map((item) => (
        <li key={item.id}>{item.name}</li>
      ))}
    </ul>
  );
}

export default ObtainICs;
