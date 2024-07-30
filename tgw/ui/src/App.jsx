import { Route, BrowserRouter as Router, Routes } from "react-router-dom";

import Init from "./pages/init/Init";
import Main from "./pages/main/Main";
import Documentation from "./pages/documentation/Documentation";

function App() {
    return (
        <>
            <Router>
                <Routes>
                    <Route path="/" element={<Init />} />
                    <Route path="/main/*" element={<Main />} />
                    <Route path="/documentation/*" element={<Documentation />} />

                </Routes>
            </Router>
           
        </>
    );
}

export default App;
