import {Link} from 'react-router-dom';

function Navbar() {
    return (
        /*<div className="navbar fixed top-4 left-1/2 z-50 w-[calc(100%-2rem)] max-w-6xl -translate-x-1/2 rounded-2xl border border-base-300/60 bg-base-100/80 px-4 shadow-lg backdrop-blur-md">*/
        <div className="navbar fixed bg-base-100 top-3 left-1/2 z-50 w-[calc(100%-10rem)] -translate-x-1/2 px-6 py-2 shadow-lg rounded-lg mb-6">
            <div className="flex-1 flex justify-start">
                <ul className="menu menu-horizontal px-1 gap-2">
                    <li><Link to="/" className="btn btn-ghost text-xl text-primary">Home</Link></li>
                    <li><p className="btn btn-ghost text-lg">About</p></li>
                    <li>
                        <a
                            href="https://tejeswar-naidu-portfolio.vercel.app/contact"
                            target="_blank"
                            rel="noreferrer"
                            className="btn btn-ghost text-lg"
                        >
                            Contact
                        </a>
                    </li>
                    <li>
                        <a
                            href="https://github.com/Tejeswar001/Lpu-Resume-Generator"
                            target="_blank"
                            rel="noreferrer"
                            className="btn btn-ghost text-lg"
                        >
                            Contribute
                        </a>
                    </li>
                </ul>
            </div>
            <div className="flex-none">
                <p className="px-3 text-xl font-bold tracking-wide text-primary">LPU Resume Builder</p>
            </div>
            <div className="flex-1 flex justify-end">
                <ul className="menu menu-horizontal px-1">
                    <li><Link to="/ResumeForm" className="btn btn-ghost text-lg">Get your Resume</Link></li>
                </ul>
            </div>
        </div>
    )
}

export default Navbar;