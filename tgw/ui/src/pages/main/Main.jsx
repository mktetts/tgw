import React from 'react';
import { Route, Routes } from 'react-router-dom';
import SocketConnection from '../../socket/SocketConnection';
import Topbar from '../../components/Topbar';
import Home from '../home/Home';
import Contribution from '../contribution/Contribution';
import Explorer from '../explorer/Explorer';
import ExplorerDetails from '../explorer/ExplorerDetails';
import Games from '../games/Games';
import GameDetails from '../games/GameDetails';
import Deploy from '../deploy/Deploy';
import Video from '../videos/Video';
import MyAssets from '../myassets/MyAssets';
import Lending from '../lending/Lending';
import Teleport from '../teleport/Teleport';
import Livestream from '../live/Livestream';
import Renting from '../renting/Renting';

function Main() {
    return (
        <div>
            <SocketConnection>
                <Topbar />
                <div
                    className='container-fluid ms-2 mt-3 content'
                    style={{ paddingLeft: '80px', paddingRight: '80px', paddingBottom: '300px', paddingTop: '120px' }}
                >
                    <Routes>
                        <Route path='/home' element={<Home />} />
                        <Route path='/contribution' element={<Contribution />} />
                        <Route path='/games' element={<Games />} />
                        <Route path='/games/:gameId' element={<GameDetails />} />
                        <Route path='/deploy' element={<Deploy />} />
                        <Route path='/myassets' element={<MyAssets />} />
                        <Route path='/lending' element={<Lending />} />
                        <Route path='/teleport' element={<Teleport />} />
                        <Route path='/livestream' element={<Livestream />} />
                        <Route path='/renting' element={<Renting />} />
                        <Route path='/explorer' element={<Explorer />} />
                        <Route path='/explorer/:id' element={<ExplorerDetails />} />
                        <Route path='/videos' element={<Video />} />
                    </Routes>
                </div>
            </SocketConnection>
        </div>
    );
}

export default Main;
