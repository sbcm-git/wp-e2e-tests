/** @format */

import config from 'config';
import assert from 'assert';

import LoginFlow from '../lib/flows/login-flow.js';

import ReaderPage from '../lib/pages/reader-page.js';

import NavBarComponent from '../lib/components/nav-bar-component.js';
import NotificationsComponent from '../lib/components/notifications-component.js';

import * as driverManager from '../lib/driver-manager.js';
import * as dataHelper from '../lib/data-helper.js';

const mochaTimeOut = config.get( 'mochaTimeoutMS' );
const startBrowserTimeoutMS = config.get( 'startBrowserTimeoutMS' );
const screenSize = driverManager.currentScreenSize();

let driver;

beforeAll( async function() {
	jest.setTimeout( startBrowserTimeoutMS );
	driver = await driverManager.startBrowser();
} );

describe( 'Reader: (' + screenSize + ') @parallel', () => {
	let testContext;

	beforeEach( () => {
		testContext = {};
	} );

	jest.setTimeout( mochaTimeOut );
	describe( 'Log in as commenting user', () => {
		it( 'Can log in as commenting user', async () => {
			testContext.loginFlow = new LoginFlow( driver, 'commentingUser' );
			return await testContext.loginFlow.login();
		} );

		describe( 'Leave a comment on the latest post in the Reader', () => {
			it( 'Can see the Reader stream', async () => {
				await ReaderPage.Expect( driver );
			} );

			it( 'The latest post is on the expected test site', async () => {
				const testSiteForNotifications = dataHelper.configGet( 'testSiteForNotifications' );
				const readerPage = await ReaderPage.Expect( driver );
				let siteOfLatestPost = await readerPage.siteOfLatestPost();
				return assert.strictEqual(
					siteOfLatestPost,
					testSiteForNotifications,
					'The latest post is not on the expected test site'
				);
			} );

			it(
				'Can comment on the latest post and see the comment appear',
				async () => {
					testContext.comment = dataHelper.randomPhrase();
					const readerPage = await ReaderPage.Expect( driver );
					await readerPage.commentOnLatestPost( testContext.comment );
					await readerPage.waitForCommentToAppear( testContext.comment );
				}
			);

			describe( 'Delete the new comment', () => {
				it( 'Can log in as test site owner', async () => {
					testContext.loginFlow = new LoginFlow( driver, 'notificationsUser' );
					return await testContext.loginFlow.login();
				} );

				it(
					'Can delete the new comment (and wait for UNDO grace period so step is actually deleted)',
					async () => {
						testContext.navBarComponent = await NavBarComponent.Expect( driver );
						await testContext.navBarComponent.openNotifications();
						testContext.notificationsComponent = await NotificationsComponent.Expect( driver );
						await testContext.notificationsComponent.selectCommentByText( testContext.comment );
						await testContext.notificationsComponent.trashComment();
						await testContext.notificationsComponent.waitForUndoMessage();
						return await testContext.notificationsComponent.waitForUndoMessageToDisappear();
					}
				);
			} );
		} );
	} );
} );
