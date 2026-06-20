import type { QueryKey, UseMutationOptions, UseMutationResult, UseQueryOptions, UseQueryResult } from "@tanstack/react-query";
import type { Airline, AirlineListResponse, Airport, AirportListResponse, AuditLogListResponse, BulkUploadRequest, BulkUploadResponse, CreateAirlineRequest, CreateAirportRequest, CreateGroundHandlerRequest, GetRawDataParams, GroundHandler, GroundHandlerListResponse, HealthStatus, ListAirlinesParams, ListAirportsParams, ListAuditLogsParams, ListGroundHandlersParams, MessageResponse, RawDataResponse, StatsResponse, StatusUpdateRequest, SyncRequest, SyncResponse, SyncStatusResponse, UpdateAirlineRequest, UpdateAirportRequest } from "./api.schemas";
import { customFetch } from "../custom-fetch";
import type { ErrorType, BodyType } from "../custom-fetch";
type AwaitedInput<T> = PromiseLike<T> | T;
type Awaited<O> = O extends AwaitedInput<infer T> ? T : never;
type SecondParameter<T extends (...args: never) => unknown> = Parameters<T>[1];
/**
 * Returns server health status
 * @summary Health check
 */
export declare const getHealthCheckUrl: () => string;
export declare const healthCheck: (options?: RequestInit) => Promise<HealthStatus>;
export declare const getHealthCheckQueryKey: () => readonly ["/api/healthz"];
export declare const getHealthCheckQueryOptions: <TData = Awaited<ReturnType<typeof healthCheck>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData> & {
    queryKey: QueryKey;
};
export type HealthCheckQueryResult = NonNullable<Awaited<ReturnType<typeof healthCheck>>>;
export type HealthCheckQueryError = ErrorType<unknown>;
/**
 * @summary Health check
 */
export declare function useHealthCheck<TData = Awaited<ReturnType<typeof healthCheck>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary List airlines
 */
export declare const getListAirlinesUrl: (params?: ListAirlinesParams) => string;
export declare const listAirlines: (params?: ListAirlinesParams, options?: RequestInit) => Promise<AirlineListResponse>;
export declare const getListAirlinesQueryKey: (params?: ListAirlinesParams) => readonly ["/api/airlines", ...ListAirlinesParams[]];
export declare const getListAirlinesQueryOptions: <TData = Awaited<ReturnType<typeof listAirlines>>, TError = ErrorType<unknown>>(params?: ListAirlinesParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listAirlines>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listAirlines>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListAirlinesQueryResult = NonNullable<Awaited<ReturnType<typeof listAirlines>>>;
export type ListAirlinesQueryError = ErrorType<unknown>;
/**
 * @summary List airlines
 */
export declare function useListAirlines<TData = Awaited<ReturnType<typeof listAirlines>>, TError = ErrorType<unknown>>(params?: ListAirlinesParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listAirlines>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Create airline
 */
export declare const getCreateAirlineUrl: () => string;
export declare const createAirline: (createAirlineRequest: CreateAirlineRequest, options?: RequestInit) => Promise<Airline>;
export declare const getCreateAirlineMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createAirline>>, TError, {
        data: BodyType<CreateAirlineRequest>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof createAirline>>, TError, {
    data: BodyType<CreateAirlineRequest>;
}, TContext>;
export type CreateAirlineMutationResult = NonNullable<Awaited<ReturnType<typeof createAirline>>>;
export type CreateAirlineMutationBody = BodyType<CreateAirlineRequest>;
export type CreateAirlineMutationError = ErrorType<unknown>;
/**
 * @summary Create airline
 */
export declare const useCreateAirline: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createAirline>>, TError, {
        data: BodyType<CreateAirlineRequest>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof createAirline>>, TError, {
    data: BodyType<CreateAirlineRequest>;
}, TContext>;
/**
 * @summary Get airline by ID
 */
export declare const getGetAirlineUrl: (id: number) => string;
export declare const getAirline: (id: number, options?: RequestInit) => Promise<Airline>;
export declare const getGetAirlineQueryKey: (id: number) => readonly [`/api/airlines/${number}`];
export declare const getGetAirlineQueryOptions: <TData = Awaited<ReturnType<typeof getAirline>>, TError = ErrorType<unknown>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getAirline>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getAirline>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetAirlineQueryResult = NonNullable<Awaited<ReturnType<typeof getAirline>>>;
export type GetAirlineQueryError = ErrorType<unknown>;
/**
 * @summary Get airline by ID
 */
export declare function useGetAirline<TData = Awaited<ReturnType<typeof getAirline>>, TError = ErrorType<unknown>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getAirline>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Update airline
 */
export declare const getUpdateAirlineUrl: (id: number) => string;
export declare const updateAirline: (id: number, updateAirlineRequest: UpdateAirlineRequest, options?: RequestInit) => Promise<Airline>;
export declare const getUpdateAirlineMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateAirline>>, TError, {
        id: number;
        data: BodyType<UpdateAirlineRequest>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof updateAirline>>, TError, {
    id: number;
    data: BodyType<UpdateAirlineRequest>;
}, TContext>;
export type UpdateAirlineMutationResult = NonNullable<Awaited<ReturnType<typeof updateAirline>>>;
export type UpdateAirlineMutationBody = BodyType<UpdateAirlineRequest>;
export type UpdateAirlineMutationError = ErrorType<unknown>;
/**
 * @summary Update airline
 */
export declare const useUpdateAirline: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateAirline>>, TError, {
        id: number;
        data: BodyType<UpdateAirlineRequest>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof updateAirline>>, TError, {
    id: number;
    data: BodyType<UpdateAirlineRequest>;
}, TContext>;
/**
 * @summary Delete airline
 */
export declare const getDeleteAirlineUrl: (id: number) => string;
export declare const deleteAirline: (id: number, options?: RequestInit) => Promise<MessageResponse>;
export declare const getDeleteAirlineMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteAirline>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof deleteAirline>>, TError, {
    id: number;
}, TContext>;
export type DeleteAirlineMutationResult = NonNullable<Awaited<ReturnType<typeof deleteAirline>>>;
export type DeleteAirlineMutationError = ErrorType<unknown>;
/**
 * @summary Delete airline
 */
export declare const useDeleteAirline: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteAirline>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof deleteAirline>>, TError, {
    id: number;
}, TContext>;
/**
 * @summary Approve or reject airline
 */
export declare const getUpdateAirlineStatusUrl: (id: number) => string;
export declare const updateAirlineStatus: (id: number, statusUpdateRequest: StatusUpdateRequest, options?: RequestInit) => Promise<Airline>;
export declare const getUpdateAirlineStatusMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateAirlineStatus>>, TError, {
        id: number;
        data: BodyType<StatusUpdateRequest>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof updateAirlineStatus>>, TError, {
    id: number;
    data: BodyType<StatusUpdateRequest>;
}, TContext>;
export type UpdateAirlineStatusMutationResult = NonNullable<Awaited<ReturnType<typeof updateAirlineStatus>>>;
export type UpdateAirlineStatusMutationBody = BodyType<StatusUpdateRequest>;
export type UpdateAirlineStatusMutationError = ErrorType<unknown>;
/**
 * @summary Approve or reject airline
 */
export declare const useUpdateAirlineStatus: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateAirlineStatus>>, TError, {
        id: number;
        data: BodyType<StatusUpdateRequest>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof updateAirlineStatus>>, TError, {
    id: number;
    data: BodyType<StatusUpdateRequest>;
}, TContext>;
/**
 * @summary List airports
 */
export declare const getListAirportsUrl: (params?: ListAirportsParams) => string;
export declare const listAirports: (params?: ListAirportsParams, options?: RequestInit) => Promise<AirportListResponse>;
export declare const getListAirportsQueryKey: (params?: ListAirportsParams) => readonly ["/api/airports", ...ListAirportsParams[]];
export declare const getListAirportsQueryOptions: <TData = Awaited<ReturnType<typeof listAirports>>, TError = ErrorType<unknown>>(params?: ListAirportsParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listAirports>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listAirports>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListAirportsQueryResult = NonNullable<Awaited<ReturnType<typeof listAirports>>>;
export type ListAirportsQueryError = ErrorType<unknown>;
/**
 * @summary List airports
 */
export declare function useListAirports<TData = Awaited<ReturnType<typeof listAirports>>, TError = ErrorType<unknown>>(params?: ListAirportsParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listAirports>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Create airport
 */
export declare const getCreateAirportUrl: () => string;
export declare const createAirport: (createAirportRequest: CreateAirportRequest, options?: RequestInit) => Promise<Airport>;
export declare const getCreateAirportMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createAirport>>, TError, {
        data: BodyType<CreateAirportRequest>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof createAirport>>, TError, {
    data: BodyType<CreateAirportRequest>;
}, TContext>;
export type CreateAirportMutationResult = NonNullable<Awaited<ReturnType<typeof createAirport>>>;
export type CreateAirportMutationBody = BodyType<CreateAirportRequest>;
export type CreateAirportMutationError = ErrorType<unknown>;
/**
 * @summary Create airport
 */
export declare const useCreateAirport: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createAirport>>, TError, {
        data: BodyType<CreateAirportRequest>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof createAirport>>, TError, {
    data: BodyType<CreateAirportRequest>;
}, TContext>;
/**
 * @summary Get airport by ID
 */
export declare const getGetAirportUrl: (id: number) => string;
export declare const getAirport: (id: number, options?: RequestInit) => Promise<Airport>;
export declare const getGetAirportQueryKey: (id: number) => readonly [`/api/airports/${number}`];
export declare const getGetAirportQueryOptions: <TData = Awaited<ReturnType<typeof getAirport>>, TError = ErrorType<unknown>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getAirport>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getAirport>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetAirportQueryResult = NonNullable<Awaited<ReturnType<typeof getAirport>>>;
export type GetAirportQueryError = ErrorType<unknown>;
/**
 * @summary Get airport by ID
 */
export declare function useGetAirport<TData = Awaited<ReturnType<typeof getAirport>>, TError = ErrorType<unknown>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getAirport>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Update airport
 */
export declare const getUpdateAirportUrl: (id: number) => string;
export declare const updateAirport: (id: number, updateAirportRequest: UpdateAirportRequest, options?: RequestInit) => Promise<Airport>;
export declare const getUpdateAirportMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateAirport>>, TError, {
        id: number;
        data: BodyType<UpdateAirportRequest>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof updateAirport>>, TError, {
    id: number;
    data: BodyType<UpdateAirportRequest>;
}, TContext>;
export type UpdateAirportMutationResult = NonNullable<Awaited<ReturnType<typeof updateAirport>>>;
export type UpdateAirportMutationBody = BodyType<UpdateAirportRequest>;
export type UpdateAirportMutationError = ErrorType<unknown>;
/**
 * @summary Update airport
 */
export declare const useUpdateAirport: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateAirport>>, TError, {
        id: number;
        data: BodyType<UpdateAirportRequest>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof updateAirport>>, TError, {
    id: number;
    data: BodyType<UpdateAirportRequest>;
}, TContext>;
/**
 * @summary Delete airport
 */
export declare const getDeleteAirportUrl: (id: number) => string;
export declare const deleteAirport: (id: number, options?: RequestInit) => Promise<MessageResponse>;
export declare const getDeleteAirportMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteAirport>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof deleteAirport>>, TError, {
    id: number;
}, TContext>;
export type DeleteAirportMutationResult = NonNullable<Awaited<ReturnType<typeof deleteAirport>>>;
export type DeleteAirportMutationError = ErrorType<unknown>;
/**
 * @summary Delete airport
 */
export declare const useDeleteAirport: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteAirport>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof deleteAirport>>, TError, {
    id: number;
}, TContext>;
/**
 * @summary Approve or reject airport
 */
export declare const getUpdateAirportStatusUrl: (id: number) => string;
export declare const updateAirportStatus: (id: number, statusUpdateRequest: StatusUpdateRequest, options?: RequestInit) => Promise<Airport>;
export declare const getUpdateAirportStatusMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateAirportStatus>>, TError, {
        id: number;
        data: BodyType<StatusUpdateRequest>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof updateAirportStatus>>, TError, {
    id: number;
    data: BodyType<StatusUpdateRequest>;
}, TContext>;
export type UpdateAirportStatusMutationResult = NonNullable<Awaited<ReturnType<typeof updateAirportStatus>>>;
export type UpdateAirportStatusMutationBody = BodyType<StatusUpdateRequest>;
export type UpdateAirportStatusMutationError = ErrorType<unknown>;
/**
 * @summary Approve or reject airport
 */
export declare const useUpdateAirportStatus: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateAirportStatus>>, TError, {
        id: number;
        data: BodyType<StatusUpdateRequest>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof updateAirportStatus>>, TError, {
    id: number;
    data: BodyType<StatusUpdateRequest>;
}, TContext>;
/**
 * @summary List ground handlers
 */
export declare const getListGroundHandlersUrl: (params?: ListGroundHandlersParams) => string;
export declare const listGroundHandlers: (params?: ListGroundHandlersParams, options?: RequestInit) => Promise<GroundHandlerListResponse>;
export declare const getListGroundHandlersQueryKey: (params?: ListGroundHandlersParams) => readonly ["/api/ground-handlers", ...ListGroundHandlersParams[]];
export declare const getListGroundHandlersQueryOptions: <TData = Awaited<ReturnType<typeof listGroundHandlers>>, TError = ErrorType<unknown>>(params?: ListGroundHandlersParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listGroundHandlers>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listGroundHandlers>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListGroundHandlersQueryResult = NonNullable<Awaited<ReturnType<typeof listGroundHandlers>>>;
export type ListGroundHandlersQueryError = ErrorType<unknown>;
/**
 * @summary List ground handlers
 */
export declare function useListGroundHandlers<TData = Awaited<ReturnType<typeof listGroundHandlers>>, TError = ErrorType<unknown>>(params?: ListGroundHandlersParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listGroundHandlers>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Create ground handler
 */
export declare const getCreateGroundHandlerUrl: () => string;
export declare const createGroundHandler: (createGroundHandlerRequest: CreateGroundHandlerRequest, options?: RequestInit) => Promise<GroundHandler>;
export declare const getCreateGroundHandlerMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createGroundHandler>>, TError, {
        data: BodyType<CreateGroundHandlerRequest>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof createGroundHandler>>, TError, {
    data: BodyType<CreateGroundHandlerRequest>;
}, TContext>;
export type CreateGroundHandlerMutationResult = NonNullable<Awaited<ReturnType<typeof createGroundHandler>>>;
export type CreateGroundHandlerMutationBody = BodyType<CreateGroundHandlerRequest>;
export type CreateGroundHandlerMutationError = ErrorType<unknown>;
/**
 * @summary Create ground handler
 */
export declare const useCreateGroundHandler: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createGroundHandler>>, TError, {
        data: BodyType<CreateGroundHandlerRequest>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof createGroundHandler>>, TError, {
    data: BodyType<CreateGroundHandlerRequest>;
}, TContext>;
/**
 * @summary Update ground handler
 */
export declare const getUpdateGroundHandlerUrl: (id: number) => string;
export declare const updateGroundHandler: (id: number, createGroundHandlerRequest: CreateGroundHandlerRequest, options?: RequestInit) => Promise<GroundHandler>;
export declare const getUpdateGroundHandlerMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateGroundHandler>>, TError, {
        id: number;
        data: BodyType<CreateGroundHandlerRequest>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof updateGroundHandler>>, TError, {
    id: number;
    data: BodyType<CreateGroundHandlerRequest>;
}, TContext>;
export type UpdateGroundHandlerMutationResult = NonNullable<Awaited<ReturnType<typeof updateGroundHandler>>>;
export type UpdateGroundHandlerMutationBody = BodyType<CreateGroundHandlerRequest>;
export type UpdateGroundHandlerMutationError = ErrorType<unknown>;
/**
 * @summary Update ground handler
 */
export declare const useUpdateGroundHandler: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateGroundHandler>>, TError, {
        id: number;
        data: BodyType<CreateGroundHandlerRequest>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof updateGroundHandler>>, TError, {
    id: number;
    data: BodyType<CreateGroundHandlerRequest>;
}, TContext>;
/**
 * @summary Delete ground handler
 */
export declare const getDeleteGroundHandlerUrl: (id: number) => string;
export declare const deleteGroundHandler: (id: number, options?: RequestInit) => Promise<MessageResponse>;
export declare const getDeleteGroundHandlerMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteGroundHandler>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof deleteGroundHandler>>, TError, {
    id: number;
}, TContext>;
export type DeleteGroundHandlerMutationResult = NonNullable<Awaited<ReturnType<typeof deleteGroundHandler>>>;
export type DeleteGroundHandlerMutationError = ErrorType<unknown>;
/**
 * @summary Delete ground handler
 */
export declare const useDeleteGroundHandler: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteGroundHandler>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof deleteGroundHandler>>, TError, {
    id: number;
}, TContext>;
/**
 * @summary Bulk upload ground handlers via CSV
 */
export declare const getBulkUploadGroundHandlersUrl: () => string;
export declare const bulkUploadGroundHandlers: (bulkUploadRequest: BulkUploadRequest, options?: RequestInit) => Promise<BulkUploadResponse>;
export declare const getBulkUploadGroundHandlersMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof bulkUploadGroundHandlers>>, TError, {
        data: BodyType<BulkUploadRequest>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof bulkUploadGroundHandlers>>, TError, {
    data: BodyType<BulkUploadRequest>;
}, TContext>;
export type BulkUploadGroundHandlersMutationResult = NonNullable<Awaited<ReturnType<typeof bulkUploadGroundHandlers>>>;
export type BulkUploadGroundHandlersMutationBody = BodyType<BulkUploadRequest>;
export type BulkUploadGroundHandlersMutationError = ErrorType<unknown>;
/**
 * @summary Bulk upload ground handlers via CSV
 */
export declare const useBulkUploadGroundHandlers: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof bulkUploadGroundHandlers>>, TError, {
        data: BodyType<BulkUploadRequest>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof bulkUploadGroundHandlers>>, TError, {
    data: BodyType<BulkUploadRequest>;
}, TContext>;
/**
 * @summary Trigger data sync from official sources
 */
export declare const getSyncDataUrl: () => string;
export declare const syncData: (syncRequest: SyncRequest, options?: RequestInit) => Promise<SyncResponse>;
export declare const getSyncDataMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof syncData>>, TError, {
        data: BodyType<SyncRequest>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof syncData>>, TError, {
    data: BodyType<SyncRequest>;
}, TContext>;
export type SyncDataMutationResult = NonNullable<Awaited<ReturnType<typeof syncData>>>;
export type SyncDataMutationBody = BodyType<SyncRequest>;
export type SyncDataMutationError = ErrorType<unknown>;
/**
 * @summary Trigger data sync from official sources
 */
export declare const useSyncData: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof syncData>>, TError, {
        data: BodyType<SyncRequest>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof syncData>>, TError, {
    data: BodyType<SyncRequest>;
}, TContext>;
/**
 * @summary Get last sync status
 */
export declare const getGetSyncStatusUrl: () => string;
export declare const getSyncStatus: (options?: RequestInit) => Promise<SyncStatusResponse>;
export declare const getGetSyncStatusQueryKey: () => readonly ["/api/sync/status"];
export declare const getGetSyncStatusQueryOptions: <TData = Awaited<ReturnType<typeof getSyncStatus>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getSyncStatus>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getSyncStatus>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetSyncStatusQueryResult = NonNullable<Awaited<ReturnType<typeof getSyncStatus>>>;
export type GetSyncStatusQueryError = ErrorType<unknown>;
/**
 * @summary Get last sync status
 */
export declare function useGetSyncStatus<TData = Awaited<ReturnType<typeof getSyncStatus>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getSyncStatus>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary View raw imported data
 */
export declare const getGetRawDataUrl: (params?: GetRawDataParams) => string;
export declare const getRawData: (params?: GetRawDataParams, options?: RequestInit) => Promise<RawDataResponse>;
export declare const getGetRawDataQueryKey: (params?: GetRawDataParams) => readonly ["/api/sync/raw-data", ...GetRawDataParams[]];
export declare const getGetRawDataQueryOptions: <TData = Awaited<ReturnType<typeof getRawData>>, TError = ErrorType<unknown>>(params?: GetRawDataParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getRawData>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getRawData>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetRawDataQueryResult = NonNullable<Awaited<ReturnType<typeof getRawData>>>;
export type GetRawDataQueryError = ErrorType<unknown>;
/**
 * @summary View raw imported data
 */
export declare function useGetRawData<TData = Awaited<ReturnType<typeof getRawData>>, TError = ErrorType<unknown>>(params?: GetRawDataParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getRawData>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary List audit logs
 */
export declare const getListAuditLogsUrl: (params?: ListAuditLogsParams) => string;
export declare const listAuditLogs: (params?: ListAuditLogsParams, options?: RequestInit) => Promise<AuditLogListResponse>;
export declare const getListAuditLogsQueryKey: (params?: ListAuditLogsParams) => readonly ["/api/audit-logs", ...ListAuditLogsParams[]];
export declare const getListAuditLogsQueryOptions: <TData = Awaited<ReturnType<typeof listAuditLogs>>, TError = ErrorType<unknown>>(params?: ListAuditLogsParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listAuditLogs>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listAuditLogs>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListAuditLogsQueryResult = NonNullable<Awaited<ReturnType<typeof listAuditLogs>>>;
export type ListAuditLogsQueryError = ErrorType<unknown>;
/**
 * @summary List audit logs
 */
export declare function useListAuditLogs<TData = Awaited<ReturnType<typeof listAuditLogs>>, TError = ErrorType<unknown>>(params?: ListAuditLogsParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listAuditLogs>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Get dashboard statistics
 */
export declare const getGetStatsUrl: () => string;
export declare const getStats: (options?: RequestInit) => Promise<StatsResponse>;
export declare const getGetStatsQueryKey: () => readonly ["/api/stats"];
export declare const getGetStatsQueryOptions: <TData = Awaited<ReturnType<typeof getStats>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getStats>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getStats>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetStatsQueryResult = NonNullable<Awaited<ReturnType<typeof getStats>>>;
export type GetStatsQueryError = ErrorType<unknown>;
/**
 * @summary Get dashboard statistics
 */
export declare function useGetStats<TData = Awaited<ReturnType<typeof getStats>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getStats>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export {};
//# sourceMappingURL=api.d.ts.map