/** @format */
import assert from 'assert';
import config from 'config';

import * as dataHelper from '../lib/data-helper';
import * as driverManager from '../lib/driver-manager';

import JetpackAuthorizePage from '../lib/pages/jetpack-authorize-page';
import JetpackConnectFlow from '../lib/flows/jetpack-connect-flow';
import LoginFlow from '../lib/flows/login-flow';
import SiteTitleTaglinePage from '../lib/pages/jetpack-onboarding/site-title-tagline-page';
import SiteTypePage from '../lib/pages/jetpack-onboarding/site-type-page';
import SetHomepagePage from '../lib/pages/jetpack-onboarding/set-homepage-page';
import ContactFormPage from '../lib/pages/jetpack-onboarding/contact-form-page';
import SummaryPage from '../lib/pages/jetpack-onboarding/summary-page';
import ViewPagePage from '../lib/pages/view-page-page';
import ViewSitePage from '../lib/pages/view-site-page';
import BusinessAddressPage from '../lib/pages/jetpack-onboarding/business-address-page';
import InstallWooCommercePage from '../lib/pages/jetpack-onboarding/install-woocommerce-page';
import WidgetContactInfoComponent from '../lib/components/widget-contact-info-component';
import WizardNavigationComponent from '../lib/components/wizard-navigation-component';
import ActivateStatsPage from '../lib/pages/jetpack-onboarding/activate-stats-page';
import WPAdminSidebar from '../lib/pages/wp-admin/wp-admin-sidebar.js';
import WPAdminJetpackPage from '../lib/pages/wp-admin/wp-admin-jetpack-page.js';
import PickAPlanPage from '../lib/pages/signup/pick-a-plan-page';

const mochaTimeOut = config.get( 'mochaTimeoutMS' );
const startBrowserTimeoutMS = config.get( 'startBrowserTimeoutMS' );
const screenSize = driverManager.currentScreenSize();
const onboardingUrlExt = '/wp-admin/admin.php?page=jetpack&action=onboard';

let driver;

beforeAll( async function() {
	jest.setTimeout( startBrowserTimeoutMS );
	driver = await driverManager.startBrowser();
} );

describe( `Jetpack Onboarding: (${ screenSize })`, () => {
	let testContext;

	beforeEach( () => {
		testContext = {};
	} );

	jest.setTimeout( mochaTimeOut );

	describe( 'Onboard personal site with static homepage: @parallel @jetpack', () => {
		const blogTitle = dataHelper.randomPhrase();
		const blogTagline = dataHelper.randomPhrase();

		beforeAll( async function () {
			return await driverManager.ensureNotLoggedIn( driver );
		} );

		it( 'Can create wporg site', async () => {
			jest.setTimeout( mochaTimeOut * 12 );

			testContext.jnFlow = new JetpackConnectFlow( driver, null );
			return await testContext.jnFlow.createJNSite();
		} );

		it( 'Can navigate to onboarding flow', async () => {
			return await driver.get( testContext.jnFlow.url + onboardingUrlExt );
		} );

		it( 'Can skip all steps', async () => {
			const wizardNavigationComponent = await WizardNavigationComponent.Expect( driver );
			for ( let step_number = 1; step_number < 6; step_number++ ) {
				await wizardNavigationComponent.skipStep( step_number );
			}
			const summaryPage = await SummaryPage.Expect( driver );
			let toDoCount = await summaryPage.countToDoSteps();
			assert.strictEqual( toDoCount, 4, 'Expected and actual steps are not equal.' );
		} );

		it( 'Can go back to first step in flow from summary page', async () => {
			const summaryPage = await SummaryPage.Expect( driver );
			return await summaryPage.visitStep( 1 );
		} );

		it( 'Can fill out site title and tagline', async () => {
			const siteTitleTaglinePage = await SiteTitleTaglinePage.Expect( driver );
			await siteTitleTaglinePage.enterTitle( blogTitle );
			await siteTitleTaglinePage.enterTagline( blogTagline );
			return await siteTitleTaglinePage.selectContinue();
		} );

		it( 'Can select Personal Site', async () => {
			const siteTypePage = await SiteTypePage.Expect( driver );
			return await siteTypePage.selectPersonalSite();
		} );

		it( 'Can select static page homepage', async () => {
			const setHomepagePage = await SetHomepagePage.Expect( driver );
			return await setHomepagePage.selectPage();
		} );

		it( 'Can select add a contact form', async () => {
			const contactFormPage = await ContactFormPage.Expect( driver );
			return await contactFormPage.selectAddContactForm();
		} );

		it( 'Can login into WordPress.com', async () => {
			const loginFlow = new LoginFlow( driver, 'jetpackConnectUser' );
			return await loginFlow.loginUsingExistingForm();
		} );

		it( 'Can approve connection on the authorization page', async () => {
			const jetpackAuthorizePage = await JetpackAuthorizePage.Expect( driver );
			return await jetpackAuthorizePage.approveConnection();
		} );

		it( 'Can select continue on add contact form', async () => {
			const contactFormPage = await ContactFormPage.Expect( driver );
			return await contactFormPage.selectContinue();
		} );

		it( 'Can select continue on activate stats page', async () => {
			const activateStatsPage = await ActivateStatsPage.Expect( driver );
			return await activateStatsPage.selectContinue();
		} );

		it( 'Can see onboarding summary page', async () => {
			const summaryPage = await SummaryPage.Expect( driver );
			let toDoCount = await summaryPage.countToDoSteps();
			assert.strictEqual( toDoCount, 0, 'Expected and actual steps are not equal.' );
			return await summaryPage.selectVisitSite();
		} );

		it( 'Can see site home page', async () => {
			const viewPagePage = await ViewPagePage.Expect( driver );
			let title = await viewPagePage.pageTitle();
			return assert.strictEqual(
				title.toUpperCase(),
				'HOME PAGE',
				'Homepage not set to a static page'
			);
		} );
	} );

	describe( 'Onboard business site with posts homepage: @parallel @jetpack', () => {
		const blogTitle = dataHelper.randomPhrase();
		const blogTagline = dataHelper.randomPhrase();
		const businessName = 'Testing Inc.';
		const countryCode = 'AU';
		const address = '888 Queen Street';
		const city = 'Brisbane';
		const stateCode = 'QLD';
		const postalCode = '4000';

		beforeAll( async function () {
			return await driverManager.ensureNotLoggedIn( driver );
		} );

		it( 'Can create wporg site', async () => {
			jest.setTimeout( mochaTimeOut * 12 );

			testContext.jnFlow = new JetpackConnectFlow( driver, null );
			return await testContext.jnFlow.createJNSite();
		} );

		it( 'Can navigate to onboarding flow', async () => {
			return await driver.get( testContext.jnFlow.url + onboardingUrlExt );
		} );

		it( 'Can fill out site title and tagline', async () => {
			const siteTitleTaglinePage = await SiteTitleTaglinePage.Expect( driver );
			await siteTitleTaglinePage.enterTitle( blogTitle );
			await siteTitleTaglinePage.enterTagline( blogTagline );
			return await siteTitleTaglinePage.selectContinue();
		} );

		it( 'Can select Business Site', async () => {
			const siteTypePage = await SiteTypePage.Expect( driver );
			return await siteTypePage.selectBusinessSite();
		} );

		it( 'Can select posts homepage', async () => {
			const setHomepagePage = await SetHomepagePage.Expect( driver );
			return await setHomepagePage.selectPosts();
		} );

		it( 'Can skip add a contact form', async () => {
			const wizardNavigationComponent = await WizardNavigationComponent.Expect( driver );
			return await wizardNavigationComponent.skipStep( 4 );
		} );

		it( 'Can select add a business address', async () => {
			const businessAddressPage = await BusinessAddressPage.Expect( driver );
			return await businessAddressPage.selectAddBusinessAddress();
		} );

		it( 'Can login into WordPress.com', async () => {
			const loginFlow = new LoginFlow( driver, 'jetpackConnectUser' );
			return await loginFlow.loginUsingExistingForm();
		} );

		it( 'Can approve connection on the authorization page', async () => {
			const jetpackAuthorizePage = await JetpackAuthorizePage.Expect( driver );
			return await jetpackAuthorizePage.approveConnection();
		} );

		it( 'Can enter address on business address page', async () => {
			const businessAddressPage = await BusinessAddressPage.Expect( driver );
			await businessAddressPage.enterBusinessAddressAndSubmit(
				businessName,
				address,
				city,
				stateCode,
				postalCode,
				countryCode
			);
			await businessAddressPage.selectContinue();
		} );

		it( 'Can make business an online store', async () => {
			const installWooCommercePage = await InstallWooCommercePage.Expect( driver );
			return await installWooCommercePage.selectSellOnline();
		} );

		it( 'Can select continue on activate stats page', async () => {
			const activateStatsPage = await ActivateStatsPage.Expect( driver );
			return await activateStatsPage.selectContinue();
		} );

		it( 'Can see onboarding summary page', async () => {
			const summaryPage = await SummaryPage.Expect( driver );
			let toDoCount = await summaryPage.countToDoSteps();
			assert.strictEqual( toDoCount, 1, 'Expected and actual steps are not equal.' );
			return await summaryPage.selectVisitSite();
		} );

		it( 'Can see site home page', async () => {
			const viewSitePage = await ViewSitePage.Expect( driver );
			const widgetContactInfoComponent = await WidgetContactInfoComponent.Expect( driver );
			const businessAddress = [ address, city, stateCode, postalCode, countryCode ];

			let title = await viewSitePage.siteTitle();
			assert.strictEqual(
				title.toUpperCase(),
				blogTitle.toUpperCase(),
				'Site title not is not correct'
			);

			let tagline = await viewSitePage.siteTagline();
			assert.strictEqual( tagline, blogTagline, 'Site tagline not is not correct' );

			let siteBusinessName = await widgetContactInfoComponent.getName();
			assert.strictEqual(
				siteBusinessName.toUpperCase(),
				businessName.toUpperCase(),
				'Business name not found on page'
			);

			let siteBusinessAddress = await widgetContactInfoComponent.getAddress();
			return assert.strictEqual(
				siteBusinessAddress,
				businessAddress.join( ' ' ),
				'Business address not found on page'
			);
		} );
	} );

	describe( 'Onboard business site with static homepage when already logged in to WordPress: @parallel @jetpack', () => {
		const blogTitle = dataHelper.randomPhrase();
		const blogTagline = dataHelper.randomPhrase();

		beforeAll( async function () {
			return await driverManager.ensureNotLoggedIn( driver );
		} );

		it( 'Can login into WordPress.com', async () => {
			const loginFlow = new LoginFlow( driver, 'jetpackConnectUser' );
			return await loginFlow.login();
		} );

		it( 'Can create wporg site', async () => {
			jest.setTimeout( mochaTimeOut * 12 );

			testContext.jnFlow = new JetpackConnectFlow( driver, null );
			return await testContext.jnFlow.createJNSite();
		} );

		it( 'Can navigate to onboarding flow', async () => {
			return await driver.get( testContext.jnFlow.url + onboardingUrlExt );
		} );

		it( 'Can fill out site title and tagline', async () => {
			const siteTitleTaglinePage = await SiteTitleTaglinePage.Expect( driver );
			await siteTitleTaglinePage.enterTitle( blogTitle );
			await siteTitleTaglinePage.enterTagline( blogTagline );
			return await siteTitleTaglinePage.selectContinue();
		} );

		it( 'Can select Business Site', async () => {
			const siteTypePage = await SiteTypePage.Expect( driver );
			return await siteTypePage.selectBusinessSite();
		} );

		it( 'Can select static homepage', async () => {
			const setHomepagePage = await SetHomepagePage.Expect( driver );
			return await setHomepagePage.selectPage();
		} );

		it( 'Can skip add a contact form', async () => {
			const wizardNavigationComponent = await WizardNavigationComponent.Expect( driver );
			return await wizardNavigationComponent.skipStep( 4 );
		} );

		it( 'Can skip add a business address', async () => {
			const wizardNavigationComponent = await WizardNavigationComponent.Expect( driver );
			return await wizardNavigationComponent.skipStep( 5 );
		} );

		it( 'Can make business an online store', async () => {
			const installWooCommercePage = await InstallWooCommercePage.Expect( driver );
			return await installWooCommercePage.selectSellOnline();
		} );

		it( 'Can select activate on activate stats page', async () => {
			const activateStatsPage = await ActivateStatsPage.Expect( driver );
			return await activateStatsPage.selectActivateStats();
		} );

		it( 'Can approve connection on the authorization page', async () => {
			const jetpackAuthorizePage = await JetpackAuthorizePage.Expect( driver );
			return await jetpackAuthorizePage.approveConnection();
		} );

		it( 'Can select activate on activate stats page', async () => {
			const activateStatsPage = await ActivateStatsPage.Expect( driver );
			return await activateStatsPage.selectContinue();
		} );

		it( 'Can see onboarding summary page', async () => {
			const summaryPage = await SummaryPage.Expect( driver );
			let toDoCount = await summaryPage.countToDoSteps();
			assert.strictEqual( toDoCount, 2, 'Expected and actual steps are not equal.' );
			return await summaryPage.selectVisitSite();
		} );

		it( 'Can see site home page', async () => {
			const viewSitePage = await ViewSitePage.Expect( driver );
			let title = await viewSitePage.siteTitle();
			assert.strictEqual(
				title.toUpperCase(),
				blogTitle.toUpperCase(),
				'Site title not is not correct'
			);
			let tagline = await viewSitePage.siteTagline();
			return assert.strictEqual( tagline, blogTagline, 'Site tagline not is not correct' );
		} );
	} );

	describe( 'Onboard personal site that has already been connected: @parallel @jetpack', () => {
		const blogTitle = dataHelper.randomPhrase();
		const blogTagline = dataHelper.randomPhrase();

		beforeAll( async function () {
			return await driverManager.ensureNotLoggedIn( driver );
		} );

		it( 'Can create wporg site', async () => {
			jest.setTimeout( mochaTimeOut * 12 );

			testContext.jnFlow = new JetpackConnectFlow( driver, null );
			return await testContext.jnFlow.createJNSite();
		} );

		it( 'Can navigate to the Jetpack dashboard', async () => {
			await WPAdminSidebar.refreshIfJNError( driver );
			const wpAdminSidebar = await WPAdminSidebar.Expect( driver );
			return await wpAdminSidebar.selectJetpack();
		} );

		it( 'Can click the Connect Jetpack button', async () => {
			const wPAdminJetpackPage = await WPAdminJetpackPage.Expect( driver );
			return await wPAdminJetpackPage.connectWordPressCom();
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

		it( 'Can navigate to onboarding flow', async () => {
			return await driver.get( testContext.jnFlow.url + onboardingUrlExt );
		} );

		it( 'Can fill out site title and tagline', async () => {
			const siteTitleTaglinePage = await SiteTitleTaglinePage.Expect( driver );
			await siteTitleTaglinePage.enterTitle( blogTitle );
			await siteTitleTaglinePage.enterTagline( blogTagline );
			return await siteTitleTaglinePage.selectContinue();
		} );

		it( 'Can select personal Site', async () => {
			const siteTypePage = await SiteTypePage.Expect( driver );
			return await siteTypePage.selectPersonalSite();
		} );

		it( 'Can select posts homepage', async () => {
			const setHomepagePage = await SetHomepagePage.Expect( driver );
			return await setHomepagePage.selectPosts();
		} );

		it( 'Can select add a contact form', async () => {
			const contactFormPage = await ContactFormPage.Expect( driver );
			return await contactFormPage.selectAddContactForm();
		} );

		it( 'Can continue on add a contact form', async () => {
			const contactFormPage = await ContactFormPage.Expect( driver );
			return await contactFormPage.selectContinue();
		} );

		it( 'Can select continue on activate stats page', async () => {
			const activateStatsPage = await ActivateStatsPage.Expect( driver );
			return await activateStatsPage.selectContinue();
		} );

		it( 'Can see onboarding summary page', async () => {
			const summaryPage = await SummaryPage.Expect( driver );
			let toDoCount = await summaryPage.countToDoSteps();
			assert.strictEqual( toDoCount, 0, 'Expected and actual steps are not equal.' );
			return await summaryPage.selectVisitSite();
		} );

		it( 'Can see site home page', async () => {
			const viewSitePage = await ViewSitePage.Expect( driver );
			let title = await viewSitePage.siteTitle();
			assert.strictEqual(
				title.toUpperCase(),
				blogTitle.toUpperCase(),
				'Site title not is not correct'
			);
			let tagline = await viewSitePage.siteTagline();
			return assert.strictEqual( tagline, blogTagline, 'Site tagline not is not correct' );
		} );
	} );
} );
