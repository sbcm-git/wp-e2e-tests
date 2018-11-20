/** @format */

import assert from 'assert';

import config from 'config';
import * as driverManager from '../lib/driver-manager';
import * as dataHelper from '../lib/data-helper';

import SettingsPage from '../lib/pages/settings-page';

import LoginFlow from '../lib/flows/login-flow';

const mochaTimeOut = config.get( 'mochaTimeoutMS' );
const startBrowserTimeoutMS = config.get( 'startBrowserTimeoutMS' );
const screenSize = driverManager.currentScreenSize();
const host = dataHelper.getJetpackHost();

let driver;

beforeAll( async function() {
	jest.setTimeout( startBrowserTimeoutMS );
	driver = await driverManager.startBrowser();
} );

describe( `[${ host }] Jetpack Settings on Calypso: (${ screenSize }) @jetpack`, () => {
	let testContext;

	beforeEach( () => {
		testContext = {};
	} );

	jest.setTimeout( mochaTimeOut );

	beforeAll( async function () {
		await driverManager.clearCookiesAndDeleteLocalStorage( driver );
	} );

	beforeAll( async function () {
		let loginFlow = new LoginFlow( driver, 'jetpackUser' + host );
		await loginFlow.loginAndSelectSettings();
		this.settingsPage = await SettingsPage.Expect( driver );
		return await this.settingsPage.selectWriting();
	} );

	describe( 'Can see Media Settings', () => {
		it( 'Can see media settings section', async () => {
			let shown = await testContext.settingsPage.mediaSettingsSectionDisplayed();
			assert( shown, "Can't see the media settings section under the Writing settings" );
		} );

		it( 'Can see the Photon toggle switch', async () => {
			let shown = await testContext.settingsPage.photonToggleDisplayed();
			assert( shown, "Can't see the Photon setting toggle under the Writing settings" );
		} );

		it( 'Can see the Carousel toggle switch', async () => {
			let shown = await testContext.settingsPage.carouselToggleDisplayed();
			assert( shown, "Can't see the carousel setting toggle under the Writing settings" );
		} );

		it( 'Can see the Carousel background color drop down', async () => {
			let shown = await testContext.settingsPage.carouseBackgroundColorDisplayed();
			assert(
				shown,
				"Can't see the carousel background color setting toggle under the Writing settings"
			);
		} );
	} );
} );
