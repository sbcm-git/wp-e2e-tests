/** @format */

import config from 'config';
import assert from 'assert';

import WPAdminSidebar from '../lib/pages/wp-admin/wp-admin-sidebar.js';
import JetpackConnectFlow from '../lib/flows/jetpack-connect-flow.js';
import MarkdownBlockComponent from '../lib/gutenberg/blocks/markdown-block-component.js';
import PostAreaComponent from '../lib/pages/frontend/post-area-component.js';
import GutenbergEditorComponent from '../lib/gutenberg/gutenberg-editor-component.js';
import * as driverManager from '../lib/driver-manager.js';
import * as dataHelper from '../lib/data-helper.js';
import WPAdminJetpackModulesPage from '../lib/pages/wp-admin/wp-admin-jetpack-modules-page.js';
import WPAdminJetpackPage from '../lib/pages/wp-admin/wp-admin-jetpack-page.js';

const mochaTimeOut = config.get( 'mochaTimeoutMS' );
const startBrowserTimeoutMS = config.get( 'startBrowserTimeoutMS' );
const screenSize = driverManager.currentScreenSize();
const host = dataHelper.getJetpackHost();

let driver;
let url;

// FIXME: Skip mobile tests for now. https://github.com/Automattic/wp-e2e-tests/issues/1509
if ( screenSize !== 'mobile' ) {
	beforeAll( async function () {
		jest.setTimeout( startBrowserTimeoutMS );
		driver = await driverManager.startBrowser();
	} );

	describe( `[${ host }] Gutenberg Markdown block: (${ screenSize }) @jetpack`, () => {
		let testContext;

		beforeEach( () => {
			testContext = {};
		} );

		jest.setTimeout( mochaTimeOut );

		describe( 'Publish a simple post with Markdown block', () => {
			const expectedHTML = `<h3>Header</h3>
<p>Some <strong>list</strong>:</p>
<ul>
<li>item a</li>
<li>item b</li>
<li>item c</li>
</ul>
`;
			// Easy way to run/develop tests against local WP instance
			// it( 'Can login to WPORG site', async function() {
			// 	const loginPage = await WPAdminLogonPage.Visit( driver, 'http://wpdev.localhost/' );
			// 	await loginPage.login( 'wordpress', 'wordpress' );
			// } );

			it( 'Can create wporg site and connect Jetpack', async () => {
				jest.setTimeout( mochaTimeOut * 12 );
				// const jnFlow = new JetpackConnectFlow( driver, 'jetpackConnectUser' );
				const jnFlow = new JetpackConnectFlow( driver, 'jetpackConnectUser', 'gutenpack' );
				await jnFlow.connectFromWPAdmin();
				url = jnFlow.url;
			} );

			it( 'Can activate Markdown module', async () => {
				await WPAdminSidebar.refreshIfJNError( driver );
				const jetpackModulesPage = await WPAdminJetpackModulesPage.Visit(
					driver,
					WPAdminJetpackModulesPage.getPageURL( url )
				);
				await jetpackModulesPage.activateMarkdown();
				await WPAdminJetpackPage.Expect( driver );
			} );

			it( 'Can start new post', async () => {
				await WPAdminSidebar.refreshIfJNError( driver );
				const wpAdminSidebar = await WPAdminSidebar.Expect( driver );
				return await wpAdminSidebar.selectNewPost();
			} );

			it( 'Can insert a markdown block', async () => {
				const gHeaderComponent = await GutenbergEditorComponent.Expect( driver );
				await gHeaderComponent.removeNUXNotice();
				testContext.markdownBlockID = await gHeaderComponent.addBlock( 'Markdown' );
			} );

			it( 'Can fill markdown block with content', async () => {
				testContext.markdownBlock = await MarkdownBlockComponent.Expect( driver, testContext.markdownBlockID );
				return await testContext.markdownBlock.setContent(
					'### Header\nSome **list**:\n\n- item a\n- item b\n- item c\n'
				);
			} );

			it( 'Can see rendered content in preview', async () => {
				await testContext.markdownBlock.switchPreview();
				const html = await testContext.markdownBlock.getPreviewHTML();
				assert.equal( html, expectedHTML );
				await testContext.markdownBlock.switchMarkdown();
			} );

			it( 'Can publish the post and see its content', async () => {
				const gHeaderComponent = await GutenbergEditorComponent.Expect( driver );
				await gHeaderComponent.publish( { visit: true } );
				const postFrontend = await PostAreaComponent.Expect( driver );
				const html = await postFrontend.getPostHTML();
				assert( html.includes( expectedHTML ) );
			} );
		} );
	} );
}
