import { Routes, Route } from 'react-router-dom';
import Home from './page';

const App = () => {
    console.log("App");
 return (
    <>
       <Routes>
          <Route path="/" element={<Home />} />
       </Routes>
    </>
 );
};

export default App;