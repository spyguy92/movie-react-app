import React, {useState, useEffect} from 'react'
import Search from "./components/Search.jsx";
import Spinner from "./components/Spinner.jsx";
import MovieCard from "./components/MovieCard.jsx";
import {useDebounce} from "react-use";
import {getTrendingMovies, updateSearchCount} from "./appwrite.js";
import error from "eslint-plugin-react/lib/util/error.js";

const API_BASE_URL = "https://api.themoviedb.org/3";
const API_KEY = import.meta.env.VITE_TMDB_API_KEY;

const OPTIONS = {
    method: "GET",
    headers: {
        Accept: "application/json",
        authorization: 'Bearer ' + API_KEY,
    }
}
const App = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [moviesList, setMoviesList] = useState([])
    const [isLoading, setIsLoading] = useState(false)
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
    const [trendingMovies, setTrendingMovies] = useState([])
    const [loadingTrending, setLoadingTrending] = useState(false)
    const [loadingError, setLoadingError] = useState('')

    useDebounce(() => setDebouncedSearchTerm(searchTerm), 500, [searchTerm])

    const fetchData = async (query = '') => {
        setIsLoading(true)
        setErrorMsg('')
        try {
            const endpoint = query ? API_BASE_URL + `/search/movie?query=${encodeURIComponent(query)}`

                : API_BASE_URL + '/discover/movie?sort_by=popularity.desc';
            const response = await fetch(endpoint, OPTIONS)
            if (!response.ok) {
                throw Error('Could not fetch movies');
            }
            const data = await response.json();
            if(data.Response === 'false') {
                setErrorMsg( data.Error ||'Could not fetch movies');
                setMoviesList([])
                return;
            }
            setMoviesList(data.results || []);

            if(query && data.results.length > 0) {

                await updateSearchCount(query, data.results[0]);
            }


        } catch (error) {
            console.log(error);
            setErrorMsg('Error fetching movies, try again later.');
        }
        finally {
            setIsLoading(false)
        }
    }

    const loadMovies = async (query = '') => {
        setLoadingTrending(true)
        setLoadingError('')
        try {
            const movies = await getTrendingMovies()
            setTrendingMovies(movies)
        } catch (error) {
            console.log(`error fetching movies ${error}`)
            setLoadingError('Could not fetch trending movies');
    } finally {
            setLoadingTrending(false)

        }
    }
    useEffect(() => {
fetchData(debouncedSearchTerm);
    }, [debouncedSearchTerm]);

    useEffect( () => {
        loadMovies()
    }, [])

    return (
        <main>
            <div className="pattern" />

            <div className="wrapper">
                <header>
                    <img src="hero.png" alt="Hero Banner" />
                    <h1>Find <span className="text-gradient">Movies</span> to enjoy without a hassle </h1>
                    <Search searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
                </header>
                {trendingMovies.length > 0 && (
                    <section className="trending">
                        <h2>Trending Movies</h2>
                        {loadingTrending ? (
                            <Spinner />
                        ) : loadingError ? (
                            <p className="text-red-500">{loadingError}</p>
                        ) : (
                            <ul>
                                {trendingMovies.map((movie, index) => (
                                    <li key={movie.$id}>
                                        <p>{index + 1}</p>
                                        <img src={movie.poster_url} alt={movie.title}/>
                                    </li>
                                ))}
                            </ul>
                        )}

                    </section>
                )}

                <section className="all-movies">
                    <h2 >All Movies</h2>
                    {isLoading ? (
                        <Spinner />
                    ) : errorMsg ? (
                        <p className="text-red-500">{errorMsg}</p>
                    ) : (
                        // <p className="text-white">Response</p>
                        <ul>
                            {moviesList.map((movie) => (
                                <MovieCard key={movie.id} movie={movie}  />
                            ))}
                        </ul>
                    )}

                </section>
            </div>
        </main>
    )
}
export default App
