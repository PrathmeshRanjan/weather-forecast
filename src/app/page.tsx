"use client";

import Container from "@/components/Container";
import ForecastWeatherDetail from "@/components/ForecastWeatherDetail";
import Navbar from "@/components/Navbar";
import WeatherDetails from "@/components/WeatherDetails";
import WeatherIcon from "@/components/WeatherIcon";
import { convertKelvinToCelsius } from "@/utils/convertKelvinToCelsius";
import { convertWindSpeed } from "@/utils/convertWindSpeed";
import { metersToKilometers } from "@/utils/metersToKilometers";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { format, fromUnixTime, parseISO } from "date-fns";
import { useAtom } from "jotai";
import { loadingCityAtom, placeAtom } from "./atom";
import { useEffect } from "react";

//https://api.openweathermap.org/data/2.5/forecast?q=lucknow&appid=714e89e55bb645b0abacede678f1aad1

interface WeatherDetail {
    dt: number;
    main: {
        temp: number;
        feels_like: number;
        temp_min: number;
        temp_max: number;
        pressure: number;
        sea_level: number;
        grnd_level: number;
        humidity: number;
        temp_kf: number;
    };
    weather: {
        id: number;
        main: string;
        description: string;
        icon: string;
    }[];
    clouds: {
        all: number;
    };
    wind: {
        speed: number;
        deg: number;
        gust: number;
    };
    visibility: number;
    pop: number;
    sys: {
        pod: string;
    };
    dt_txt: string;
}

interface WeatherData {
    cod: string;
    message: number;
    cnt: number;
    list: WeatherDetail[];
    city: {
        id: number;
        name: string;
        coord: {
            lat: number;
            lon: number;
        };
        country: string;
        population: number;
        timezone: number;
        sunrise: number;
        sunset: number;
    };
}

export default function Home() {
    const [place, setPlace] = useAtom(placeAtom);
    const [_] = useAtom(loadingCityAtom);
    const { isPending, error, data, refetch } = useQuery<WeatherData>({
        queryKey: ["repoData"],
        queryFn: async () => {
            const { data } = await axios.get(
                `https:api.openweathermap.org/data/2.5/forecast?q=${place}&appid=714e89e55bb645b0abacede678f1aad1`
            );
            return data;
        },
    });

    useEffect(() => {
        refetch();
    }, [place, refetch]);

    const firstData = data?.list[0];

    const uniqueDates = [
        ...new Set(
            data?.list.map(
                (entry) => new Date(entry.dt * 1000).toISOString().split("T")[0]
            )
        ),
    ];

    // Filtering data to get the first entry after 6 AM for each unique date
    var firstDataForEachDate = uniqueDates.map((date) => {
        return data?.list.find((entry) => {
            const entryDate = new Date(entry.dt * 1000)
                .toISOString()
                .split("T")[0];
            const entryTime = new Date(entry.dt * 1000).getHours();
            return entryDate === date && entryTime >= 6;
        });
    });

    firstDataForEachDate = firstDataForEachDate.slice(1);

    if (isPending)
        return (
            <div className="flex justify-center items-center min-h-screen">
                <p className="animate-bounce">Loading...</p>
            </div>
        );
    if (error) return "An error has occurred: " + error.message;

    return (
        <div className="flex flex-col gap-4 min-h-screen">
            <Navbar location={data.city.name} />
            <main className="px-3 max-w-7xl mx-auto flex flex-col gap-9 w-full pb-10 pt-4">
                {/* Today's Weather */}
                <section className="space-y-4">
                    <div className="space-y-2">
                        <h2 className="flex gap-1 text-2xl items-end">
                            <p>
                                {format(
                                    parseISO(firstData?.dt_txt ?? ""),
                                    "EEEE"
                                )}
                            </p>
                            <p className="text-lg">
                                (
                                {format(
                                    parseISO(firstData?.dt_txt ?? ""),
                                    "dd.MM.yyyy"
                                )}
                                )
                            </p>
                        </h2>
                        <Container className="gap-10 px-6 items-center">
                            {/* Temperature */}
                            <div className="flex flex-col p-6 mx-2">
                                <span className="text-5xl">
                                    {convertKelvinToCelsius(
                                        firstData?.main.temp ?? 296.37
                                    )}
                                    °
                                </span>
                                <p className="text-xs space-x-1 whitespace-nowrap">
                                    <span> Feels like</span>
                                    <span>
                                        {convertKelvinToCelsius(
                                            firstData?.main.feels_like ?? 296.37
                                        )}
                                        °↓
                                    </span>
                                </p>
                                <p className="text-xs space-x-2">
                                    <span>
                                        {convertKelvinToCelsius(
                                            firstData?.main.temp_min ?? 296.37
                                        )}
                                        °↓
                                    </span>
                                    <span>
                                        {convertKelvinToCelsius(
                                            firstData?.main.temp_max ?? 296.37
                                        )}
                                        °↑
                                    </span>
                                </p>
                            </div>
                            {/* Time and weather */}
                            <div className="flex gap-10 sm:gap-16 overflow-x-auto w-full justify-between pr-3">
                                {data?.list.map((data, i) => (
                                    <div
                                        key={i}
                                        className="flex flex-col justify-between gap-2 items-center text-xs font-semibold"
                                    >
                                        <p className="whitespace-nowrap">
                                            {" "}
                                            {format(
                                                parseISO(data.dt_txt),
                                                "h:mm a"
                                            )}{" "}
                                        </p>
                                        <WeatherIcon
                                            // iconName={getDayOrNightIcon(
                                            //     data.weather[0].icon,
                                            //     data.dt_txt
                                            // )}
                                            iconName={data.weather[0].icon}
                                        />
                                        <p>
                                            {convertKelvinToCelsius(
                                                data?.main.temp ?? 296.37
                                            )}
                                            °
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </Container>
                    </div>
                    <div className="flex gap-4">
                        {/* left */}
                        <Container className="w-fit justify-center flex-col px-4 items-center">
                            <p className="capitalize text-center">
                                {firstData?.weather[0].description}
                            </p>
                            <WeatherIcon
                                iconName={firstData?.weather[0].icon ?? ""}
                            />
                        </Container>
                        {/* right */}
                        <Container className="bg-green-500/80 px-6 gap-4 justify-between overflow-x-auto">
                            <WeatherDetails
                                visibility={metersToKilometers(
                                    firstData?.visibility ?? 10000
                                )}
                                airPressure={`${firstData?.main.pressure} hPa`}
                                humidity={`${firstData?.main.humidity}%`}
                                sunrise={format(
                                    fromUnixTime(
                                        data?.city.sunrise ?? 1702949452
                                    ),
                                    "H:mm"
                                )}
                                sunset={format(
                                    fromUnixTime(
                                        data?.city.sunset ?? 1702517657
                                    ),
                                    "H:mm"
                                )}
                                windSpeed={convertWindSpeed(
                                    firstData?.wind.speed ?? 1.64
                                )}
                            />
                        </Container>
                    </div>
                </section>
                {/* 5 day weather forecast */}
                <section className="flex w-full flex-col gap-4">
                    <p className="text-2xl">Forecast (5 days)</p>
                    {firstDataForEachDate.map((d, i) => (
                        <ForecastWeatherDetail
                            key={i}
                            description={d?.weather[0].description ?? ""}
                            weatherIcon={d?.weather[0].icon ?? "01d"}
                            date={d ? format(parseISO(d.dt_txt), "dd.MM") : ""}
                            day={
                                d ? format(parseISO(d.dt_txt), "EEEE") : "EEEE"
                            }
                            feels_like={d?.main.feels_like ?? 0}
                            temp={d?.main.temp ?? 0}
                            temp_max={d?.main.temp_max ?? 0}
                            temp_min={d?.main.temp_min ?? 0}
                            airPressure={`${d?.main.pressure} hPa `}
                            humidity={`${d?.main.humidity}% `}
                            sunrise={format(
                                fromUnixTime(data?.city.sunrise ?? 1702517657),
                                "H:mm"
                            )}
                            sunset={format(
                                fromUnixTime(data?.city.sunset ?? 1702517657),
                                "H:mm"
                            )}
                            visibility={`${metersToKilometers(
                                d?.visibility ?? 10000
                            )} `}
                            windSpeed={`${convertWindSpeed(
                                d?.wind.speed ?? 1.64
                            )} `}
                        />
                    ))}
                </section>
            </main>
        </div>
    );
}
