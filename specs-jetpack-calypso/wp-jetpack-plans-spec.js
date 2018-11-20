/** @format */

import config from 'config';

import * as driverManager from '../lib/driver-manager';
import * as driverHelper from '../lib/driver-helper';
import * as dataHelper from '../lib/data-helper';

import LoginFlow from '../lib/flows/login-flow';

import PlansPage from '../lib/pages/plans-page';
import StatsPage from '../lib/pages/stats-page';
import WPAdminJetpackPage from '../lib/pages/wp-admin/wp-admin-jetpack-page';
import JetpackPlanSalesPage from '../lib/pages/jetpack-plans-sales-page';

import ReaderPage from '../lib/pages/reader-page.js';
import SecurePaymentComponent from '../lib/components/secure-payment-component.js';
import ShoppingCartWidgetComponent from '../lib/components/shopping-cart-widget-component.js';
import SidebarComponent from '../lib/components/sidebar-component.js';
import NavBarComponent from '../lib/components/nav-bar-component.js';

import WPAdminSidebar from '../lib/pages/wp-admin/wp-admin-sidebar';

import ProfilePage from '../lib/pages/profile-page.js';
import PurchasesPage from '../lib/pages/purchases-page.js';
import ManagePurchasePage from '../lib/pages/manage-purchase-page.js';
import WPAdminLogonPage from '../lib/pages/wp-admin/wp-admin-logon-page';

const mochaTimeOut = config.get( 'mochaTimeoutMS' );
const startBrowserTimeoutMS = config.get( 'startBrowserTimeoutMS' );
const screenSize = driverManager.currentScreenSize();
const host = dataHelper.getJetpackHost();

let driver;

beforeAll( async function() {
	jest.setTimeout( startBrowserTimeoutMS );
	driver = await driverManager.startBrowser();
} );

describe( `[${ host }] Jetpack Plans: (${ screenSize }) @jetpack`, () => {
	let testContext;

	beforeEach( () => {
		testContext = {};
	} );

	jest.setTimeout( mochaTimeOut );

	describe( 'Purchase Premium Plan:', () => {
		beforeAll( async function () {
			return await driverManager.clearCookiesAndDeleteLocalStorage( driver );
		} );

		it( 'Can log into WordPress.com', async () => {
			testContext.loginFlow = new LoginFlow( driver, 'jetpackUser' + host );
			return await testContext.loginFlow.login();
		} );

		it( 'Can log into site via Jetpack SSO', async () => {
			const loginPage = await WPAdminLogonPage.Visit( driver, dataHelper.getJetpackSiteName() );
			return await loginPage.logonSSO();
		} );

		it( 'Can open Jetpack dashboard', async () => {
			await WPAdminSidebar.refreshIfJNError( driver );
			const wpAdminSidebar = await WPAdminSidebar.Expect( driver );
			return await wpAdminSidebar.selectJetpack();
		} );

		it( 'Can find and click Upgrade nudge button', async () => {
			await driverHelper.refreshIfJNError( driver );
			const jetpackDashboard = await WPAdminJetpackPage.Expect( driver );
			await driver.sleep( 3000 ); // The nudge buttons are loaded after the page, and there's no good loaded status indicator to key off of
			return await jetpackDashboard.clickUpgradeNudge();
		} );

		it( 'Can click the Proceed button', async () => {
			const jetpackPlanSalesPage = await JetpackPlanSalesPage.Expect( driver );
			await driver.sleep( 3000 ); // The upgrade buttons are loaded after the page, and there's no good loaded status indicator to key off of
			return await jetpackPlanSalesPage.clickPurchaseButton();
		} );

		it( 'Can then see secure payment component', async () => {
			return await SecurePaymentComponent.Expect( driver );
		} );

		// Remove all items from basket for clean up
		afterAll( async function () {
			await ReaderPage.Visit( driver );

			const navbarComponent = await NavBarComponent.Expect( driver );
			await navbarComponent.clickMySites();

			await StatsPage.Expect( driver );

			const sidebarComponent = await SidebarComponent.Expect( driver );
			await sidebarComponent.selectPlan();

			await PlansPage.Expect( driver );
			const shoppingCartWidgetComponent = await ShoppingCartWidgetComponent.Expect( driver );
			await shoppingCartWidgetComponent.empty();
		} );
	} );

	describe( 'Renew Premium Plan:', () => {
		beforeAll( async function () {
			return await driverManager.clearCookiesAndDeleteLocalStorage( driver );
		} );

		it( 'Can log into WordPress.com', async () => {
			testContext.loginFlow = new LoginFlow( driver, 'jetpackUserPREMIUM' );
			return await testContext.loginFlow.login();
		} );

		it( '"Renew Now" link takes user to Payment Details form', async () => {
			const navBarComponent = await NavBarComponent.Expect( driver );
			await navBarComponent.clickProfileLink();
			const profilePage = await ProfilePage.Expect( driver );
			await profilePage.chooseManagePurchases();
			const purchasesPage = await PurchasesPage.Expect( driver );
			await purchasesPage.dismissGuidedTour();
			await purchasesPage.selectPremiumPlanOnConnectedSite();
			const managePurchasePage = await ManagePurchasePage.Expect( driver );
			await managePurchasePage.chooseRenewNow();
			return await SecurePaymentComponent.Expect( driver );
		} );
	} );
} );
