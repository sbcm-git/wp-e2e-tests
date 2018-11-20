/** @format */

import config from 'config';

import * as driverManager from '../../lib/driver-manager';
import * as driverHelper from '../../lib/driver-helper';
import * as dataHelper from '../../lib/data-helper';

import LoginFlow from '../../lib/flows/login-flow';

import PickAPlanPage from '../../lib/pages/signup/pick-a-plan-page';
import WPAdminJetpackPage from '../../lib/pages/wp-admin/wp-admin-jetpack-page';

import WPAdminSidebar from '../../lib/pages/wp-admin/wp-admin-sidebar';
import WPAdminPluginsPage from '../../lib/pages/wp-admin/wp-admin-plugins-page';
import JetpackAuthorizePage from '../../lib/pages/jetpack-authorize-page';
import WPAdminLogonPage from '../../lib/pages/wp-admin/wp-admin-logon-page';

const mochaTimeOut = config.get( 'mochaTimeoutMS' );
const startBrowserTimeoutMS = config.get( 'startBrowserTimeoutMS' );
const screenSize = driverManager.currentScreenSize();
const host = dataHelper.getJetpackHost();

var driver;

beforeAll( function() {
	jest.setTimeout( startBrowserTimeoutMS );
	driver = driverManager.startBrowser();
} );

describe( `[${ host }] Jetpack Connection: (${ screenSize }) @jetpack`, function() {
	jest.setTimeout( mochaTimeOut );

	describe( 'Activate Jetpack Plugin:', function() {
		beforeAll( async function() {
			return await driverManager.clearCookiesAndDeleteLocalStorage( driver );
		} );

		it( 'Can log into WordPress.com', async function() {
			this.loginFlow = new LoginFlow( driver, 'jetpackUserCI' );
			return await this.loginFlow.login();
		} );

		it( 'Can log into site via wp-login.php', async function() {
			const user = dataHelper.getAccountConfig( 'jetpackUserCI' );
			const loginPage = await WPAdminLogonPage.Visit( driver, dataHelper.getJetpackSiteName() );
			await loginPage.login( user[ 0 ], user[ 1 ] );
		} );

		it( 'Can open Plugins page', async function() {
			await WPAdminSidebar.refreshIfJNError( driver );
			this.wpAdminSidebar = await WPAdminSidebar.Expect( driver );
			return await this.wpAdminSidebar.selectPlugins();
		} );

		it( 'Can activate Jetpack', async function() {
			await driverHelper.refreshIfJNError( driver );
			this.wpAdminPlugins = await WPAdminPluginsPage.Expect( driver );
			return await this.wpAdminPlugins.activateJetpack();
		} );

		it( 'Can connect Jetpack', async function() {
			this.wpAdminPlugins.connectJetpackAfterActivation();
			this.jetpackAuthorizePage = await JetpackAuthorizePage.Expect( driver );
			await this.jetpackAuthorizePage.approveConnection();
		} );

		it( 'Can select Free plan', async function() {
			const pickAPlanPage = await PickAPlanPage.Expect( driver );
			return await pickAPlanPage.selectFreePlan();
		} );

		it( 'Can activate recommended features', async function() {
			await driverHelper.refreshIfJNError( driver );
			this.jetpackDashboard = await WPAdminJetpackPage.Expect( driver );
			return await this.jetpackDashboard.activateRecommendedFeatures();
		} );
	} );
} );
