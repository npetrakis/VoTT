import { IApplicationState } from "../../models/applicationState";
// tslint:disable-next-line: no-var-requires
require("dotenv").config();

/**
 * Initial state of application
 * @member appSettings - Application settings
 * @member connections - Connections
 * @member recentProjects - Recent projects
 * @member currentProject - Current project
 */

const initialState: IApplicationState = {
    appSettings: {
        devToolsEnabled: false,
        securityTokens: [],
    },
    connections: [],
    recentProjects: [],
    currentProject: null,
    appError: null,
};

export default function getInitialState(): IApplicationState {
    const state = initialState;
    state.appSettings.securityTokens.push(
        {
            name: process.env.REACT_APP_SECURITY_TOKEN_NAME,
            key: process.env.REACT_APP_SECURITY_TOKEN_KEY,
        },
    );
    return state;
}
