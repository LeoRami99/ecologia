//navbar
const Navbar = () => {
    return (
        <div className="navbar backdrop-blur bg-base-100/50 top-0 sticky">
            <div className="navbar-start">
                <div className="dropdown" >
                    <label htmlFor="my-drawer">

                        <div tabIndex={0} role="button" className="btn btn-ghost btn-circle text-white">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M4 6h16M4 12h16M4 18h7" />
                            </svg>
                        </div>
                    </label>
                </div>
            </div>
            <div className="navbar-center">
                <a className="btn btn-ghost text-xl text-white">EcoIA</a>
            </div>
            <div className="navbar-end">

            </div>
        </div>
    )
}

export default Navbar;