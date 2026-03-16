import {Link} from 'react-router-dom';

function Navbar() {
    return (
        <div className="navbar fixed top-4 left-1/2 z-50 w-[calc(100%-2rem)] max-w-6xl -translate-x-1/2 rounded-2xl border border-base-300/60 bg-base-100/80 px-4 shadow-lg backdrop-blur-md">
            <div className="flex-1 flex justify-start">
                <Link to="/" className="btn btn-ghost text-xl">Resume</Link>
            </div>
            <div className="flex-none">
                <ul className="menu menu-horizontal px-1">
                    <li><Link to="/ResumeForm">Get your Resume</Link></li>
                </ul>
            </div>
        </div>
    )
}

export default Navbar;