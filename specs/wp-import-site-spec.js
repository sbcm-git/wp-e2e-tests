/** @format */

import config from 'config';
import assert from 'assert';

import LoginFlow from '../lib/flows/login-flow.js';

import NavBarComponent from '../lib/components/nav-bar-component.js';
import SideBarComponent from '../lib/components/sidebar-component';

import ImporterPage from '../lib/pages/settings/importer-page';

import * as driverManager from '../lib/driver-manager.js';

const mochaTimeOut = config.get( 'mochaTimeoutMS' );
const startBrowserTimeoutMS = config.get( 'startBrowserTimeoutMS' );
const screenSize = driverManager.currentScreenSize();

let driver;

beforeAll( async function() {
	jest.setTimeout( startBrowserTimeoutMS );
	driver = await driverManager.startBrowser();
} );

describe( 'Verify Import Option: (' + screenSize + ') @parallel', () => {
	jest.setTimeout( mochaTimeOut );

	it( 'Can log in as default user', async () => {
		const loginFlow = new LoginFlow( driver );
		return await loginFlow.login();
	} );

	it( 'Can open the sidebar', async () => {
		const navBarComponent = await NavBarComponent.Expect( driver );
		await navBarComponent.clickMySites();
	} );

	it( "Can see an 'Import' option", async () => {
		const sideBarComponent = await SideBarComponent.Expect( driver );
		return assert(
			await sideBarComponent.settingsOptionExists(),
			'The settings menu option does not exist'
		);
	} );

	it( "Following 'Import' menu option opens the Import page", async () => {
		const sideBarComponent = await SideBarComponent.Expect( driver );
		await sideBarComponent.selectImport();
		await ImporterPage.Expect( driver );
	} );

	it( 'Can see the WordPress importer', async () => {
		const importerPage = await ImporterPage.Expect( driver );
		assert( await importerPage.importerIsDisplayed( 'wordpress' ) );
	} );

	it( 'Can see the Medium importer', async () => {
		const importerPage = await ImporterPage.Expect( driver );
		assert( await importerPage.importerIsDisplayed( 'medium' ) );
	} );

	it( 'Can see the Blogger importer', async () => {
		const importerPage = await ImporterPage.Expect( driver );
		assert( await importerPage.importerIsDisplayed( 'blogger-alt' ) );
	} );
} );
