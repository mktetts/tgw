import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Init from "./pages/Init";
import Main from "./pages/Main";


function App() {
    return (
        <>
            <Router>
                <Routes>
                    <Route path="/" element={<Init />} />
                    <Route path="/main" element={<Main />} />
                </Routes>
            </Router>
        </>
    );
}

export default App;
