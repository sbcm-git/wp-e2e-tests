/** @format */

import config from 'config';
import assert from 'assert';

import LoginFlow from '../lib/flows/login-flow';
import SignUpFlow from '../lib/flows/sign-up-flow';

import AddNewSitePage from '../lib/pages/add-new-site-page';
import JetpackAuthorizePage from '../lib/pages/jetpack-authorize-page';
import PickAPlanPage from '../lib/pages/signup/pick-a-plan-page';
import WPAdminJetpackPage from '../lib/pages/wp-admin/wp-admin-jetpack-page.js';
import WPAdminDashboardPage from '../lib/pages/wp-admin/wp-admin-dashboard-page';
import WPAdminNewUserPage from '../lib/pages/wp-admin/wp-admin-new-user-page';
import WPAdminLogonPage from '../lib/pages/wp-admin/wp-admin-logon-page';
import WPAdminSidebar from '../lib/pages/wp-admin/wp-admin-sidebar.js';
import SidebarComponent from '../lib/components/sidebar-component';
import JetpackConnectFlow from '../lib/flows/jetpack-connect-flow';
import JetpackConnectPage from '../lib/pages/jetpack/jetpack-connect-page';
import JetpackConnectAddCredentialsPage from '../lib/pages/jetpack/jetpack-connect-add-credentials-page';
import PlansPage from '../lib/pages/plans-page';
import LoginPage from '../lib/pages/login-page';
import JetpackComPage from '../lib/pages/external/jetpackcom-page';
import JetpackComFeaturesDesignPage from '../lib/pages/external/jetpackcom-features-design-page';
import WooWizardSetupPage from '../lib/pages/woocommerce/woo-wizard-setup-page';
import WooWizardPaymentsPage from '../lib/pages/woocommerce/woo-wizard-payments-page';
import WooWizardShippingPage from '../lib/pages/woocommerce/woo-wizard-shipping-page';
import WooWizardExtrasPage from '../lib/pages/woocommerce/woo-wizard-extras-page';
import WooWizardJetpackPage from '../lib/pages/woocommerce/woo-wizard-jetpack-page';
import WooWizardReadyPage from '../lib/pages/woocommerce/woo-wizard-ready-page';

import * as driverManager from '../lib/driver-manager';
import * as driverHelper from '../lib/driver-helper';
import * as dataHelper from '../lib/data-helper';
import JetpackComPricingPage from '../lib/pages/external/jetpackcom-pricing-page';
import SecurePaymentComponent from '../lib/components/secure-payment-component';
import WPHomePage from '../lib/pages/wp-home-page';
import CheckOutThankyouPage from '../lib/pages/signup/checkout-thankyou-page';

const mochaTimeOut = config.get( 'mochaTimeoutMS' );
const startBrowserTimeoutMS = config.get( 'startBrowserTimeoutMS' );
const screenSize = driverManager.currentScreenSize();
const signupInboxId = config.get( 'signupInboxId' );
const testCreditCardDetails = dataHelper.getTestCreditCardDetails();
const sandboxCookieValue = config.get( 'storeSandboxCookieValue' );
const locale = driverManager.currentLocale();
const siteName = dataHelper.getJetpackSiteName();

let driver;

beforeAll( async function() {
	jest.setTimeout( startBrowserTimeoutMS );
	driver = await driverManager.startBrowser();
} );

describe( `Jetpack Connect: (${ screenSize })`, () => {
	let testContext;

	beforeEach( () => {
		testContext = {};
	} );

	jest.setTimeout( mochaTimeOut );

	describe( 'Disconnect expired sites: @parallel @jetpack @canary', () => {
		const timeout = mochaTimeOut * 10;

		jest.setTimeout( timeout );

		beforeAll( async function () {
			return await driverManager.ensureNotLoggedIn( driver );
		} );

		it( 'Can disconnect any expired sites', async () => {
			return await new JetpackConnectFlow( driver, 'jetpackConnectUser' ).removeSites( timeout );
		} );
	} );

	describe( 'Connect From Calypso: @parallel @jetpack @canary', () => {
		beforeAll( async function () {
			return await driverManager.ensureNotLoggedIn( driver );
		} );

		it( 'Can create wporg site', async () => {
			jest.setTimeout( mochaTimeOut * 12 );

			const template = dataHelper.isRunningOnJetpackBranch() ? 'branch' : 'default';
			testContext.jnFlow = new JetpackConnectFlow( driver, null, template );
			return await testContext.jnFlow.createJNSite();
		} );

		it( 'Can log in', async () => {
			const loginFlow = new LoginFlow( driver, 'jetpackConnectUser' );
			await loginFlow.loginAndSelectMySite();
		} );

		it( 'Can add new site', async () => {
			const sidebarComponent = await SidebarComponent.Expect( driver );
			await sidebarComponent.addNewSite( driver );
			const addNewSitePage = await AddNewSitePage.Expect( driver );
			return await addNewSitePage.addSiteUrl( testContext.jnFlow.url );
		} );

		it( 'Can click the free plan button', async () => {
			const pickAPlanPage = await PickAPlanPage.Expect( driver );
			return await pickAPlanPage.selectFreePlanJetpack();
		} );

		it( 'Has site URL in route', async done => {
			const siteSlug = testContext.jnFlow.url.replace( /^https?:\/\//, '' );
			let url = await driver.getCurrentUrl();
			if ( url.includes( siteSlug ) ) {
				return done();
			}
			return done( `Route ${ url } does not include site slug ${ siteSlug }` );
		} );
	} );

	describe( 'Connect From wp-admin: @parallel @jetpack @canary', () => {
		beforeAll( async function () {
			return await driverManager.ensureNotLoggedIn( driver );
		} );

		it( 'Can create wporg site', async () => {
			jest.setTimeout( mochaTimeOut * 12 );

			const template = dataHelper.isRunningOnJetpackBranch() ? 'branch' : 'default';
			testContext.jnFlow = new JetpackConnectFlow( driver, null, template );
			return await testContext.jnFlow.createJNSite();
		} );

		it( 'Can navigate to the Jetpack dashboard', async () => {
			await WPAdminSidebar.refreshIfJNError( driver );
			testContext.wpAdminSidebar = await WPAdminSidebar.Expect( driver );
			return await testContext.wpAdminSidebar.selectJetpack();
		} );

		it( 'Can click the Connect Jetpack button', async () => {
			await driverHelper.refreshIfJNError( driver );
			testContext.wpAdminJetpack = await WPAdminJetpackPage.Expect( driver );
			return await testContext.wpAdminJetpack.connectWordPressCom();
		} );

		it( 'Can login into WordPress.com', async () => {
			const loginFlow = new LoginFlow( driver, 'jetpackConnectUser' );
			return await loginFlow.loginUsingExistingForm();
		} );

		it( 'Can approve connection on the authorization page', async () => {
			const jetpackAuthorizePage = await JetpackAuthorizePage.Expect( driver );
			return await jetpackAuthorizePage.approveConnection();
		} );

		it( 'Can click the free plan button', async () => {
			const pickAPlanPage = await PickAPlanPage.Expect( driver );
			return await pickAPlanPage.selectFreePlanJetpack();
		} );

		it(
			'Is redirected back to the Jetpack dashboard with Jumpstart displayed',
			async () => {
				return await testContext.wpAdminJetpack.jumpstartDisplayed();
			}
		);
	} );

	describe( 'Pre-connect from Jetpack.com using free plan: @parallel @jetpack', () => {
		beforeAll( async function () {
			return await driverManager.ensureNotLoggedIn( driver );
		} );

		it( 'Can select Try it Free', async () => {
			const jetPackComPage = await JetpackComPage.Visit( driver );
			return await jetPackComPage.selectTryItFree();
		} );

		it( 'Can select free plan', async () => {
			const pickAPlanPage = await PickAPlanPage.Expect( driver );
			return await pickAPlanPage.selectFreePlanJetpack();
		} );

		it( 'Can see Jetpack connect page', async () => {
			return await JetpackConnectPage.Expect( driver );
		} );
	} );

	describe( 'Connect via SSO: @parallel @jetpack', () => {
		beforeAll( async function () {
			return await driverManager.ensureNotLoggedIn( driver );
		} );

		it( 'Can register new Subscriber user', async () => {
			testContext.accountName = dataHelper.getNewBlogName();
			testContext.emailAddress = dataHelper.getEmailAddress( testContext.accountName, signupInboxId );
			testContext.password = config.get( 'passwordForNewTestSignUps' );
			const signupFlow = new SignUpFlow( driver, {
				accountName: testContext.accountName,
				emailAddress: testContext.emailAddress,
				password: testContext.password,
			} );
			await signupFlow.signupFreeAccount();
			await signupFlow.activateAccount();
			return await driverManager.ensureNotLoggedIn( driver );
		} );

		it( 'Can log into WordPress.com', async () => {
			return await new LoginFlow( driver ).login();
		} );

		it( 'Can log into site via Jetpack SSO', async () => {
			const loginPage = await WPAdminLogonPage.Visit( driver, dataHelper.getJetpackSiteName() );
			return await loginPage.logonSSO();
		} );

		it( 'Add new user as Subscriber in wp-admin', async () => {
			await WPAdminSidebar.refreshIfJNError( driver );
			const wpAdminSidebar = await WPAdminSidebar.Expect( driver );
			await wpAdminSidebar.selectAddNewUser();
			await WPAdminNewUserPage.refreshIfJNError( driver );
			const wpAdminNewUserPage = await WPAdminNewUserPage.Expect( driver );
			return await wpAdminNewUserPage.addUser( testContext.emailAddress );
		} );

		it( 'Log out from WP Admin', async () => {
			await driverManager.ensureNotLoggedIn( driver );
			await WPAdminDashboardPage.refreshIfJNError( driver );
			const wPAdminDashboardPage = await WPAdminDashboardPage.Visit(
				driver,
				WPAdminDashboardPage.getUrl( siteName )
			);
			return await wPAdminDashboardPage.logout();
		} );

		it( 'Can log in as Subscriber', async () => {
			const loginPage = await LoginPage.Visit( driver );
			return await loginPage.login( testContext.accountName, testContext.password );
		} );

		it( 'Can login via SSO into WP Admin', async () => {
			const wpAdminLogonPage = await WPAdminLogonPage.Visit( driver, siteName );
			await wpAdminLogonPage.logonSSO();
			const jetpackAuthorizePage = await JetpackAuthorizePage.Expect( driver );
			return await jetpackAuthorizePage.approveSSOConnection();
		} );
	} );

	describe( 'Pre-connect from Jetpack.com using "Install Jetpack" button: @parallel @jetpack', () => {
		beforeAll( async function () {
			return await driverManager.ensureNotLoggedIn( driver );
		} );

		it( 'Can select Install Jetpack on Design Page', async () => {
			const jetpackComFeaturesDesignPage = await JetpackComFeaturesDesignPage.Visit( driver );
			return await jetpackComFeaturesDesignPage.installJetpack();
		} );

		it( 'Can see Jetpack connect page', async () => {
			return await JetpackConnectPage.Expect( driver );
		} );
	} );

	describe( 'Connect from Jetpack.com Pricing page and buy paid plan: @parallel @jetpack', () => {
		let jnFlow;

		beforeAll( async function () {
			return await driverManager.ensureNotLoggedIn( driver );
		} );

		it( 'We can set the sandbox cookie for payments', async () => {
			const wpHomePage = await WPHomePage.Visit( driver );
			await wpHomePage.checkURL( locale );
			return await wpHomePage.setSandboxModeForPayments( sandboxCookieValue );
		} );

		it( 'Can create wporg site', async () => {
			jest.setTimeout( mochaTimeOut * 12 );

			jnFlow = new JetpackConnectFlow( driver, null, 'noJetpack' );
			return await jnFlow.createJNSite();
		} );

		it( 'Can select buy Premium on Pricing Page', async () => {
			const jetpackComPricingPage = await JetpackComPricingPage.Visit( driver );
			return await jetpackComPricingPage.buyPremium();
		} );

		it( 'Can start connection flow using JN site', async () => {
			const jetPackConnectPage = await JetpackConnectPage.Expect( driver );
			return await jetPackConnectPage.addSiteUrl( jnFlow.url );
		} );

		it(
			'Can enter the Jetpack credentials and install Jetpack',
			async () => {
				const jetpackConnectAddCredentialsPage = await JetpackConnectAddCredentialsPage.Expect(
					driver
				);
				return await jetpackConnectAddCredentialsPage.enterDetailsAndConnect(
					jnFlow.username,
					jnFlow.password
				);
			}
		);

		it( 'Can wait for Jetpack get connected', async () => {
			const jetpackAuthorizePage = await JetpackAuthorizePage.Expect( driver );
			return await jetpackAuthorizePage.waitToDisappear();
		} );

		it( 'Can log into WP.com', async () => {
			const user = dataHelper.getAccountConfig( 'jetpackConnectUser' );
			const loginPage = await LoginPage.Expect( driver );
			return await loginPage.login( user[ 0 ], user[ 1 ] );
		} );

		it(
			'Can see the secure payment page and enter/submit test payment details',
			async () => {
				const securePaymentComponent = await SecurePaymentComponent.Expect( driver );
				await securePaymentComponent.payWithStoredCardIfPossible( testCreditCardDetails );
				await securePaymentComponent.waitForCreditCardPaymentProcessing();
				return await securePaymentComponent.waitForPageToDisappear();
			}
		);

		it( 'Can see Premium Thank You page', async () => {
			const checkOutThankyouPage = await CheckOutThankyouPage.Expect( driver );
			const isPremium = await checkOutThankyouPage.isPremiumPlan();
			return assert( isPremium, 'The Thank You Notice is not for the Premium Plan' );
		} );
	} );

	describe( 'Connect From WooCommerce plugin when Jetpack is not installed: @parallel @jetpack', () => {
		const countryCode = 'US';
		const stateCode = 'CO';
		const address = '2101 Blake St';
		const address2 = '';
		const city = 'Denver';
		const postalCode = '80205';
		const currency = 'USD';
		const productType = 'physical';

		beforeAll( async function () {
			return await driverManager.ensureNotLoggedIn( driver );
		} );

		it( 'Can create wporg site', async () => {
			jest.setTimeout( mochaTimeOut * 12 );

			testContext.jnFlow = new JetpackConnectFlow( driver, null, 'wooCommerceNoJetpack' );
			return await testContext.jnFlow.createJNSite();
		} );

		it( 'Can enter WooCommerce Wizard', async () => {
			await WPAdminDashboardPage.refreshIfJNError( driver );
			const wPAdminDashboardPage = await WPAdminDashboardPage.Expect( driver );
			return await wPAdminDashboardPage.enterWooCommerceWizard();
		} );

		it( 'Can fill out and submit store information form', async () => {
			const wooWizardSetupPage = await WooWizardSetupPage.Expect( driver );
			return await wooWizardSetupPage.enterStoreDetailsAndSubmit( {
				countryCode,
				stateCode,
				address,
				address2,
				city,
				postalCode,
				currency,
				productType,
			} );
		} );

		it( 'Can continue through payments information', async () => {
			const wooWizardPaymentsPage = await WooWizardPaymentsPage.Expect( driver );
			return await wooWizardPaymentsPage.selectContinue();
		} );

		it( 'Can continue through shipping information', async () => {
			const wooWizardShippingPage = await WooWizardShippingPage.Expect( driver );
			await wooWizardShippingPage.fillFlatRates();
			return await wooWizardShippingPage.selectContinue();
		} );

		it( 'Can continue through extras information', async () => {
			const wooWizardExtrasPage = await WooWizardExtrasPage.Expect( driver );
			return await wooWizardExtrasPage.selectContinue();
		} );

		it( 'Can activate Jetpack', async () => {
			jest.setTimeout( mochaTimeOut * 5 );

			const wooWizardJetpackPage = await WooWizardJetpackPage.Expect( driver );
			return await wooWizardJetpackPage.selectContinueWithJetpack();
		} );

		it( 'Can log into WP.com', async () => {
			const user = dataHelper.getAccountConfig( 'jetpackConnectUser' );
			const loginPage = await LoginPage.Expect( driver );
			return await loginPage.login( user[ 0 ], user[ 1 ] );
		} );

		it( 'Can wait for Jetpack get connected', async () => {
			const jetpackAuthorizePage = await JetpackAuthorizePage.Expect( driver );
			return await jetpackAuthorizePage.waitToDisappear();
		} );

		it( 'Can see the Woo wizard ready page', async () => {
			return await WooWizardReadyPage.Expect( driver );
		} );
	} );

	describe( 'Remote Installation Connect From Calypso, when Jetpack not installed: @parallel @jetpack', () => {
		let jnFlow;

		beforeAll( async function () {
			return await driverManager.ensureNotLoggedIn( driver );
		} );

		it( 'Can create wporg site', async () => {
			jest.setTimeout( mochaTimeOut * 12 );

			jnFlow = new JetpackConnectFlow( driver, null, 'noJetpack' );
			return await jnFlow.createJNSite();
		} );

		it( 'Can log in', async () => {
			return await new LoginFlow( driver, 'jetpackConnectUser' ).loginAndSelectMySite();
		} );

		it( 'Can add new site', async () => {
			const sideBarComponent = await SidebarComponent.Expect( driver );
			await sideBarComponent.addNewSite();
			const addNewSitePage = await AddNewSitePage.Expect( driver );
			return await addNewSitePage.addSiteUrl( jnFlow.url );
		} );

		it(
			'Can enter the Jetpack credentials and install Jetpack',
			async () => {
				const jetpackConnectAddCredentialsPage = await JetpackConnectAddCredentialsPage.Expect(
					driver
				);
				return await jetpackConnectAddCredentialsPage.enterDetailsAndConnect(
					jnFlow.username,
					jnFlow.password
				);
			}
		);

		it( 'Can wait for Jetpack get connected', async () => {
			const jetpackAuthorizePage = await JetpackAuthorizePage.Expect( driver );
			return await jetpackAuthorizePage.waitToDisappear();
		} );

		it( 'Can click the free plan button', async () => {
			const pickAPlanPage = await PickAPlanPage.Expect( driver );
			return await pickAPlanPage.selectFreePlanJetpack();
		} );

		it( 'Can then see the Jetpack plan page in Calypso', async () => {
			return await PlansPage.Expect( driver );
		} );
	} );
} );
