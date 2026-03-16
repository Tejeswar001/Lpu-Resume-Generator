import { Link } from 'react-router-dom';

function Home() {
    return (
        <div className="bg-base-200">
            <section className="relative flex min-h-screen items-center overflow-hidden px-4 pb-10 pt-28 sm:pt-24">
                <div className="pointer-events-none absolute inset-0">
                    <div className="absolute left-1/2 top-10 h-[30rem] w-[30rem] -translate-x-1/2 rounded-full bg-primary/15 blur-3xl" />
                    <div className="absolute bottom-0 left-1/2 h-[24rem] w-[24rem] -translate-x-1/2 rounded-full bg-secondary/10 blur-3xl" />
                </div>

                <div className="relative mx-auto flex w-[min(1240px,96%)] flex-col items-center text-center">
                    <div className="max-w-4xl">
                        <h1 className="text-4xl font-black leading-[1.06] text-primary sm:text-5xl lg:text-6xl xl:text-7xl">
                            Build A Strong Resume,
                            <br />
                            Get Interview Ready
                        </h1>
                        <p className="mx-auto mt-5 max-w-3xl text-base leading-7 text-base-content/75 sm:mt-6 sm:text-lg sm:leading-8 lg:text-xl">
                            A simple and clean resume platform for LPU students with guided sections, fast import, and live A4 preview.
                        </p>
                        <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
                            <Link to="/ResumeForm" className="btn btn-primary btn-lg px-8 text-base">
                                Start Building
                            </Link>
                            <a
                                href="https://github.com/Tejeswar001/Lpu-Resume-Generator"
                                target="_blank"
                                rel="noreferrer"
                                className="btn btn-outline btn-lg px-8 text-base"
                            >
                                GitHub Repo
                            </a>
                        </div>
                    </div>

                    <div className="mt-12 grid w-full grid-cols-1 gap-5 md:grid-cols-3">
                        <div className="card rounded-3xl border border-base-300 bg-base-100/92 shadow-lg backdrop-blur-sm">
                            <div className="card-body items-center p-7 text-center">
                                <h3 className="text-2xl font-bold text-primary">Simple Editor</h3>
                                <p className="text-base leading-7 text-base-content/70">Clean multi-section editing with collapsible blocks.</p>
                            </div>
                        </div>
                        <div className="card rounded-3xl border border-base-300 bg-base-100/92 shadow-lg backdrop-blur-sm">
                            <div className="card-body items-center p-7 text-center">
                                <h3 className="text-2xl font-bold text-primary">Fast Import</h3>
                                <p className="text-base leading-7 text-base-content/70">Paste text or JSON and auto-fill resume fields instantly.</p>
                            </div>
                        </div>
                        <div className="card rounded-3xl border border-base-300 bg-base-100/92 shadow-lg backdrop-blur-sm">
                            <div className="card-body items-center p-7 text-center">
                                <h3 className="text-2xl font-bold text-primary">Live A4</h3>
                                <p className="text-base leading-7 text-base-content/70">See exactly how your final resume looks as you edit.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}

export default Home;