import {Link} from 'react-router-dom';

function Navbar() {
    return (
        <div className="navbar fixed left-1/2 top-3 z-50 w-[calc(100%-1rem)] max-w-7xl -translate-x-1/2 rounded-xl border border-base-300 bg-base-100 px-2 py-2 shadow-lg sm:w-[calc(100%-2rem)] sm:px-4">
            <div className="flex items-center gap-2">
                <div className="dropdown lg:hidden">
                    <label tabIndex={0} className="btn btn-ghost btn-square" aria-label="Open menu">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </label>
                    <ul tabIndex={0} className="menu dropdown-content z-[1] mt-2 w-56 rounded-box border border-base-300 bg-base-100 p-2 shadow">
                        <li><Link to="/">Home</Link></li>
                        <li><a href="https://tejeswar-naidu-portfolio.vercel.app/contact" target="_blank" rel="noreferrer">Contact</a></li>
                        <li><a href="https://github.com/Tejeswar001/Lpu-Resume-Generator" target="_blank" rel="noreferrer">Contribute</a></li>
                        <li><Link to="/ResumeForm">Get your Resume</Link></li>
                    </ul>
                </div>

                <Link to="/" className="text-base font-bold tracking-wide text-primary sm:text-xl">LPU Resume Builder</Link>
            </div>

            <div className="hidden flex-1 justify-center lg:flex">
                <ul className="menu menu-horizontal gap-1 px-1">
                    <li><Link to="/" className="btn btn-ghost text-base">Home</Link></li>
                    <li>
                        <a
                            href="https://tejeswar-naidu-portfolio.vercel.app/contact"
                            target="_blank"
                            rel="noreferrer"
                            className="btn btn-ghost text-base"
                        >
                            Contact
                        </a>
                    </li>
                    <li>
                        <a
                            href="https://github.com/Tejeswar001/Lpu-Resume-Generator"
                            target="_blank"
                            rel="noreferrer"
                            className="btn btn-ghost text-base"
                        >
                            Contribute
                        </a>
                    </li>
                </ul>
            </div>

            <div className="ml-auto">
                <Link to="/ResumeForm" className="btn btn-primary btn-sm sm:btn-md">Get Resume</Link>
            </div>
        </div>
    )
}

export default Navbar;