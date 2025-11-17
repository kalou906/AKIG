import React from 'react';

function App() {
  return (
    <div style={{ padding: '20px' }}>
      <h1>✅ AKIG FONCTIONNE !</h1>
      <p>Félicitations ! Ton application React est opérationnelle.</p>
      <div style={{ marginTop: '20px' }}>
        <button 
          onClick={() => alert('Super ! Tout marche parfaitement !')}
          style={{ 
            padding: '10px 20px', 
            backgroundColor: '#007bff', 
            color: 'white', 
            border: 'none', 
            borderRadius: '5px',
            fontSize: '16px',
            cursor: 'pointer'
          }}
        >
          Tester le bouton
        </button>
      </div>
    </div>
  );
}

export default App;