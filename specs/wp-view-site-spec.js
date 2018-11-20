/** @format */

import assert from 'assert';

import config from 'config';
import * as driverManager from '../lib/driver-manager.js';
import * as dataHelper from '../lib/data-helper';

import SidebarComponent from '../lib/components/sidebar-component.js';
import SiteViewComponent from '../lib/components/site-view-component.js';
import LoginFlow from '../lib/flows/login-flow.js';

const mochaTimeOut = config.get( 'mochaTimeoutMS' );
const startBrowserTimeoutMS = config.get( 'startBrowserTimeoutMS' );
const screenSize = driverManager.currentScreenSize();
const host = dataHelper.getJetpackHost();

let driver;

beforeAll( async function() {
	jest.setTimeout( startBrowserTimeoutMS );
	driver = await driverManager.startBrowser();
} );

describe( `[${ host }] View site from sidebar: (${ screenSize }) @parallel @jetpack`, () => {
	let testContext;

	beforeEach( () => {
		testContext = {};
	} );

	jest.setTimeout( mochaTimeOut );
	describe( 'View site and close:', () => {
		it( 'Can Log In and go to My Sites', async () => {
			const loginFlow = new LoginFlow( driver );
			return await loginFlow.loginAndSelectMySite();
		} );

		it( 'Can view the default site from sidebar', async () => {
			testContext.sidebarComponent = await SidebarComponent.Expect( driver );
			return await testContext.sidebarComponent.selectViewThisSite();
		} );

		it( 'Can see the web preview button', async () => {
			testContext.siteViewComponent = await SiteViewComponent.Expect( driver );
			let present = await testContext.siteViewComponent.isWebPreviewPresent();
			return assert.strictEqual( present, true, 'The web preview button was not displayed' );
		} );

		it( 'Can see the web preview "open in new window" button', async () => {
			let present = await testContext.siteViewComponent.isOpenInNewWindowButtonPresent();
			return assert.strictEqual(
				present,
				true,
				'The web preview "open in new window" button was not displayed'
			);
		} );

		it( 'Can see the site preview', async () => {
			let present = await testContext.siteViewComponent.isSitePresent();
			return assert.strictEqual( present, true, 'The web site preview was not displayed' );
		} );

		if ( screenSize !== 'mobile' ) {
			it( 'Can see the Search & Social preview', async () => {
				await testContext.siteViewComponent.selectSearchAndSocialPreview();
			} );
		}

		if ( screenSize === 'mobile' ) {
			it( 'Can close site view', async () => {
				return await testContext.siteViewComponent.close( driver );
			} );

			it( 'Can see sidebar again', async () => {
				let displayed = await testContext.sidebarComponent.displayed();
				return assert( displayed, 'The sidebar was not displayed' );
			} );
		}
	} );
} );
