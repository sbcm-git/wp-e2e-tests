/** @format */
import config from 'config';

import LoginFlow from '../lib/flows/login-flow';
import JetpackAuthorizePage from '../lib/pages/jetpack-authorize-page';
import PickAPlanPage from '../lib/pages/signup/pick-a-plan-page';
import WPAdminJetpackPage from '../lib/pages/wp-admin/wp-admin-jetpack-page.js';
import WPAdminLogonPage from '../lib/pages/wp-admin/wp-admin-logon-page';
import WPAdminSidebar from '../lib/pages/wp-admin/wp-admin-sidebar.js';
import JetpackConnectFlow from '../lib/flows/jetpack-connect-flow';
import WPAdminPostsPage from '../lib/pages/wp-admin/wp-admin-posts-page';
import WPAdminDashboardPage from '../lib/pages/wp-admin/wp-admin-dashboard-page';
import * as driverManager from '../lib/driver-manager';
import * as dataHelper from '../lib/data-helper';

const mochaTimeOut = config.get( 'mochaTimeoutMS' );
const startBrowserTimeoutMS = config.get( 'startBrowserTimeoutMS' );
const screenSize = driverManager.currentScreenSize();
const jetpackUser = process.env.JETPACKUSER;
const user = dataHelper.getAccountConfig( jetpackUser );
let driver;

beforeAll( async function() {
	jest.setTimeout( startBrowserTimeoutMS );
	driver = await driverManager.startBrowser();
} );

describe( 'Disconnect wporg site', () => {
	jest.setTimeout( mochaTimeOut );

	it( 'Can disconnect wporg site', async () => {
		await driverManager.clearCookiesAndDeleteLocalStorage( driver, user[ 2 ] );
		await new JetpackConnectFlow( driver, 'jetpackConnectUser' ).disconnectFromWPAdmin(
			jetpackUser
		);
		await driverManager.clearCookiesAndDeleteLocalStorage( driver, user[ 2 ] );
	} );
} );

describe( `Jetpack Connect and Disconnect: (${ screenSize })`, () => {
	jest.setTimeout( mochaTimeOut );

	beforeAll( async function () {
		return driverManager.ensureNotLoggedIn( driver );
	} );

	describe( 'Connect Jetpack and see if post page is loading correctly', () => {
		it( 'Can login into WordPress.com', async () => {
			const loginFlow = new LoginFlow( driver, 'jetpackConnectUser' );
			return await loginFlow.login();
		} );

		it( 'Login into wporg site', async () => {
			const loginPage = await WPAdminLogonPage.Visit( driver, user[ 2 ] );
			await loginPage.login( user[ 0 ], user[ 1 ] );
		} );

		it( 'Can navigate to the Jetpack dashboard', async () => {
			const wpAdminSidebar = await WPAdminSidebar.Expect( driver );
			return await wpAdminSidebar.selectJetpack();
		} );

		it( 'Can click the Connect Jetpack button', async () => {
			const wpAdminJetpack = await WPAdminJetpackPage.Expect( driver );
			return await wpAdminJetpack.connectWordPressCom();
		} );

		it( 'Can approve connection on the authorization page', async () => {
			const jetpackAuthorizePage = await JetpackAuthorizePage.Expect( driver );
			return await jetpackAuthorizePage.approveConnection();
		} );

		it( 'Can click the free plan button', async () => {
			// Some of the users are not the plan owners, so skipping this step for them
			if (
				[ 'siteGroundJetpackUser', 'bluehostJetpackUserSub', 'goDaddyJetpackUserSub' ].includes(
					jetpackUser
				)
			) {
				return await WPAdminDashboardPage.Visit( driver, user[ 2 ] );
			}
			const pickAPlanPage = await PickAPlanPage.Expect( driver );
			return await pickAPlanPage.selectFreePlanJetpack();
		} );

		it( 'Can navigate to the Posts page', async () => {
			const wpAdminSidebar = await WPAdminSidebar.Expect( driver );
			return await wpAdminSidebar.selectAllPosts();
		} );

		it( 'Can load a post and make sure it is loaded correctly', async () => {
			const postsPage = await WPAdminPostsPage.Expect( driver );
			return await postsPage.viewFirstPost();
		} );
	} );

	describe( 'Disconnect from Jetpack and load a post page', () => {
		it( 'Can disconnect Jetpack connection in wp-admin', async () => {
			await driverManager.clearCookiesAndDeleteLocalStorage( driver, user[ 2 ] );
			await new JetpackConnectFlow( driver, 'jetpackConnectUser' ).disconnectFromWPAdmin(
				jetpackUser
			);
		} );

		it( 'Can navigate to the Posts page', async () => {
			const wpAdminSidebar = await WPAdminSidebar.Expect( driver );
			return await wpAdminSidebar.selectAllPosts();
		} );

		it( 'Can load a post and make sure it is loaded correctly', async () => {
			const postsPage = await WPAdminPostsPage.Expect( driver );
			return await postsPage.viewFirstPost();
		} );
	} );
} );
