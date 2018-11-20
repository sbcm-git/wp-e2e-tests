/** @format */

import config from 'config';

import PressableLogonPage from '../lib/pages/pressable/pressable-logon-page';
import PressableSitesPage from '../lib/pages/pressable/pressable-sites-page';
import PressableApprovePage from '../lib/pages/pressable/pressable-approve-page';
import PressableSiteSettingsPage from '../lib/pages/pressable/pressable-site-settings-page';
import JetpackAuthorizePage from '../lib/pages/jetpack-authorize-page';
import * as driverManager from '../lib/driver-manager';
import * as dataHelper from '../lib/data-helper';
import PressableNUXFlow from '../lib/flows/pressable-nux-flow';
import ReaderPage from '../lib/pages/reader-page';
import SidebarComponent from '../lib/components/sidebar-component';
import NavBarComponent from '../lib/components/nav-bar-component';
import JetpackConnectFlow from '../lib/flows/jetpack-connect-flow';
import LoginFlow from '../lib/flows/login-flow';

const mochaTimeOut = config.get( 'mochaTimeoutMS' );
const startBrowserTimeoutMS = config.get( 'startBrowserTimeoutMS' );
const screenSize = driverManager.currentScreenSize();
const host = dataHelper.getJetpackHost();

let driver;

// Disabled due to p1535659602000200-slack-e2e-testing-discuss
// tl;dr: There is a bug in my.pressable.com which cause some noise/warnings/errors
// We shouldn't create new Pressable sites for every test.
if ( false ) {
	beforeAll( async function () {
		jest.setTimeout( startBrowserTimeoutMS );
		driver = await driverManager.startBrowser();
	} );

	describe( `[${ host }] Pressable NUX: (${ screenSize })`, () => {
		let testContext;

		beforeEach( () => {
			testContext = {};
		} );

		jest.setTimeout( mochaTimeOut * 2 );

		describe( 'Disconnect expired sites: @parallel @jetpack', () => {
			const timeout = mochaTimeOut * 10;

			jest.setTimeout( timeout );

			beforeAll( async function () {
				return await driverManager.ensureNotLoggedIn( driver );
			} );

			it( 'Can disconnect any expired sites', async () => {
				return await new JetpackConnectFlow( driver ).removeSites( timeout );
			} );
		} );

		describe( 'Connect via Pressable @parallel @jetpack', () => {
			beforeAll( async function () {
				return await driverManager.ensureNotLoggedIn( driver );
			} );

			it( 'Can log into WordPress.com', async () => {
				return await new LoginFlow( driver, 'jetpackUser' + host ).login();
			} );

			it( 'Can log into Pressable', async () => {
				const pressableLogonPage = await PressableLogonPage.Visit( driver );
				return await pressableLogonPage.loginWithWP();
			} );

			it( 'Can approve login with WordPress', async () => {
				const pressableApprovePage = await PressableApprovePage.Expect( driver );
				return await pressableApprovePage.approve();
			} );

			it( 'Can create new site', async () => {
				testContext.siteName = dataHelper.getNewBlogName();
				testContext.pressableSitesPage = await PressableSitesPage.Expect( driver );
				return await testContext.pressableSitesPage.addNewSite( testContext.siteName );
			} );

			it( 'Can go to site settings', async () => {
				return await testContext.pressableSitesPage.gotoSettings( testContext.siteName );
			} );

			it( 'Can proceed to Jetpack activation', async () => {
				const siteSettings = await PressableSiteSettingsPage.Expect( driver );
				await siteSettings.waitForJetpackPremium();
				return await siteSettings.activateJetpackPremium();
			} );

			it( 'Can approve connection on the authorization page', async () => {
				const jetpackAuthorizePage = await JetpackAuthorizePage.Expect( driver );
				return await jetpackAuthorizePage.approveConnection();
			} );

			it(
				'Can wait for 30 sec until Jetpack Rewind will be ready for configuration',
				() => {
					return driver.sleep( 30000 );
				}
			);

			it( 'Can proceed with Pressable NUX flow', async () => {
				return await new PressableNUXFlow( driver ).addSiteCredentials();
			} );

			it( 'Can open Rewind activity page', async () => {
				await ReaderPage.Visit( driver );
				const navBarComponent = await NavBarComponent.Expect( driver );
				await navBarComponent.clickMySites();
				const sidebarComponent = await SidebarComponent.Expect( driver );
				await sidebarComponent.selectSiteSwitcher();
				await sidebarComponent.searchForSite( testContext.siteName );
				await sidebarComponent.selectActivity();
			} );

			// Disabled due to to longer time is required to make a backup.
			// it( 'Can wait until Rewind backup is completed', function() {
			// 	const activityPage = new ActivityPage( driver );
			// 	return activityPage.waitUntilBackupCompleted();
			// } );

			afterAll( async function () {
				const pressableSitesPage = await PressableSitesPage.Visit( driver );
				return await pressableSitesPage.deleteFirstSite();
			} );
		} );
	} );
}
