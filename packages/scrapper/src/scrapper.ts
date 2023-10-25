import axios, { type AxiosRequestConfig } from 'axios';

interface IRequest {
    <T>(url: string, request: AxiosRequestConfig, defaultValue: unknown): Promise<T | null>
}

export interface IScrapper {
    (mode: 'API' | 'DOM', baseUrl: string): IRequest
}

export const scrapper: IScrapper = (mode, baseUrl) => async (url, request, defaultValue = null) => {
    switch (mode) {
        case 'API':
            try {
                const res = await axios.get(baseUrl + url, request);
                return res.data;
            } catch(err) {
                console.log(err)
                return defaultValue;
            }
        case 'DOM':
            return 'TODO'
    }

}