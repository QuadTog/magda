// @flow

import fetch from "isomorphic-fetch";
import { config } from "../config";
import { actionTypes } from "../constants/ActionTypes";
import {
    validateProjectName,
    validateProjectDescription
} from "../helpers/project";
import type {
    ProjectAction,
    RawProject,
    RawProjects,
    ProjectProps
} from "../helpers/project";
import type { Dispatch, GetState, FetchError } from "../types";
// import {browserHistory} from 'react-router-dom';

export function requestProjects(): ProjectAction {
    return {
        type: actionTypes.REQUEST_PROJECTS
    };
}

export function receiveProjects(json: RawProjects): ProjectAction {
    return {
        type: actionTypes.RECEIVE_PROJECTS,
        json
    };
}

export function requestProjectsError(error: FetchError): ProjectAction {
    return {
        type: actionTypes.REQUEST_PROJECTS_ERROR,
        error
    };
}

export function requestProject(): ProjectAction {
    return {
        type: actionTypes.REQUEST_PROJECT
    };
}

export function receiveProject(json: RawProject): ProjectAction {
    return {
        type: actionTypes.RECEIVE_PROJECT,
        json
    };
}

export function requestProjectError(error: FetchError): ProjectAction {
    return {
        type: actionTypes.REQUEST_PROJECT_ERROR,
        error
    };
}

export function validateProjectFields(props: ProjectProps): ProjectAction {
    return {
        type: actionTypes.VALIDATE_PROJECT_FIELDS
    };
}

export function validateProjectFieldsFailure(
    fieldErrors: ProjectProps
): ProjectAction {
    return {
        type: actionTypes.VALIDATE_PROJECT_FIELDS_FAILURE,
        fieldErrors
    };
}

export function resetProjectFields(): ProjectAction {
    return {
        type: actionTypes.RESET_PROJECT_FIELDS
    };
}

export function createProject(): ProjectAction {
    return {
        type: actionTypes.CREATE_PROJECT
    };
}

export function createProjectSuccess(
    json: RawProject,
    showNotification: boolean
): ProjectAction {
    return {
        type: actionTypes.CREATE_PROJECT_SUCCESS,
        json,
        showNotification
    };
}

export function createProjectFailure(error: FetchError): ProjectAction {
    return {
        type: actionTypes.CREATE_PROJECT_FAILURE,
        error
    };
}

export function updateProject() {
    return {
        type: actionTypes.UPDATE_PROJECT
    };
}

export function updateProjectSuccess(json: ProjectProps) {
    return {
        type: actionTypes.UPDATE_PROJECT_SUCCESS,
        json
    };
}

export function updateProjectFailure(error: FetchError) {
    return {
        type: actionTypes.UPDATE_PROJECT_FAILURE,
        error
    };
}

export function updateProjectStatus(project: ProjectProps) {
    return (dispatch: Dispatch) => {
        dispatch(updateProject());
        const url = `${config.registryApiUrl}records/${
            project.id
        }/aspects/project`;
        const body = [
            {
                op: "replace",
                path: "/status",
                value: project.status === "open" ? "closed" : "open"
            }
        ];
        return fetch(url, {
            method: "PATCH",
            body: JSON.stringify(body),
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json"
            },
            credentials: "include"
        })
            .then(response => {
                if (response.ok) {
                    return response.json();
                }
                const error = {
                    title: response.status,
                    detail: response.statusText
                };
                return dispatch(updateProjectFailure(error));
            })
            .then((result: ProjectProps) => {
                if (result.error) {
                    return false;
                }
                dispatch(updateProjectSuccess(result));
            });
    };
}

export function postNewProject(props: ProjectProps) {
    return (dispatch: Dispatch) => {
        dispatch(createProject());
        const url = config.registryApiUrl + "records";

        return fetch(url, {
            method: "POST",
            body: JSON.stringify(props),
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json"
            },
            credentials: "include"
        })
            .then(response => {
                if (response.status === 200) {
                    return response.json();
                }
                return dispatch(
                    createProjectFailure({
                        title: response.status,
                        detail: response.statusText
                    })
                );
            })
            .then((result: RawProject) => {
                if (result.error) {
                    return false;
                }
                dispatch(createProjectSuccess(result, true));
                setTimeout(function() {
                    dispatch(createProjectSuccess(result, false));
                }, 5000);
            });
    };
}

export function validateFields(props: Object) {
    return (dispatch: Dispatch) => {
        dispatch(validateProjectFields(props));
        const nameError = validateProjectName(props.get("name"));
        const descriptionError = validateProjectDescription(
            props.getIn(["aspects", "project", "description"])
        );
        if (!nameError && !descriptionError) {
            dispatch(postNewProject(props.toJS()));
        } else {
            dispatch(
                validateProjectFieldsFailure(
                    Object.assign({}, props, {
                        name: nameError,
                        description: descriptionError
                    })
                )
            );
        }
    };
}

export function fetchProjectsFromRegistry(start: number): Object {
    return (dispatch: Dispatch) => {
        dispatch(requestProjects());
        let url: string = `${
            config.registryApiUrl
        }records?aspect=project&limit=${config.resultsPerPage}&start=${(start -
            1) *
            config.resultsPerPage}`;
        console.log(url);
        return fetch(url)
            .then(response => {
                if (response.status >= 400) {
                    return dispatch(
                        requestProjectsError({
                            title: response.status,
                            detail: response.statusText
                        })
                    );
                }
                return response.json();
            })
            .then((json: Object) => dispatch(receiveProjects(json)));
    };
}

export function fetchProjectsIfNeeded(start: number) {
    return (dispatch: Dispatch, getState: GetState) => {
        if (!getState().project.isFetching) {
            return dispatch(fetchProjectsFromRegistry(start));
        } else {
            return Promise.resolve();
        }
    };
}

export function fetchProjectFromRegistry(projectId: string): Object {
    return (dispatch: Dispatch) => {
        dispatch(requestProject());
        let url: string =
            config.registryApiUrl + "records/" + projectId + "?aspect=project";
        return fetch(url)
            .then(response => {
                if (response.status >= 400) {
                    return dispatch(
                        requestProjectError({
                            title: response.status,
                            detail: response.statusText
                        })
                    );
                }
                return response.json();
            })
            .then((json: RawProject) => dispatch(receiveProject(json)));
    };
}

export function fetchProjectIfNeeded(projectId: string) {
    return (dispatch: Dispatch, getState: GetState) => {
        if (!getState().project.isFetching) {
            return dispatch(fetchProjectFromRegistry(projectId));
        } else {
            return Promise.resolve();
        }
    };
}
