import { Wallet } from 'zksync';
import { Tester } from './tester';
import { utils } from 'ethers';
import './priority-ops';
import './change-pub-key';
import './withdrawal-helpers';
import './forced-exit-requests';

import { loadTestConfig } from './helpers';

const TX_AMOUNT = utils.parseEther('1');
const DEPOSIT_AMOUNT = TX_AMOUNT.mul(200);

const TEST_CONFIG = loadTestConfig();

// The token here should have the ERC20 implementation from RevertTransferERC20.sol
const erc20Token = 'wBTC';

describe.only('Withdrawal helpers tests', () => {
    let tester: Tester;
    let alice: Wallet;
    let bob: Wallet;

    before('create tester and test wallets', async () => {
        tester = await Tester.init('localhost', 'HTTP');
        alice = await tester.fundedWallet('10.0');
        bob = await tester.fundedWallet('10.0');

        for (const token of ['ETH', erc20Token]) {
            await tester.testDeposit(alice, token, DEPOSIT_AMOUNT, true);
            await tester.testChangePubKey(alice, token, false);
        }

        // This is needed to interact with blockchain
        alice.ethSigner.connect(tester.ethProvider);
    });

    after('disconnect tester', async () => {
        await tester.disconnect();
    });

    it('should recover failed ETH withdraw', async () => {
        await tester.testRecoverETHWithdrawal(alice, TEST_CONFIG.withdrawalHelpers.revert_receive_address, TX_AMOUNT);
    });

    it('should recover failed ERC20 withdraw', async () => {
        await tester.testRecoverERC20Withdrawal(
            alice,
            TEST_CONFIG.withdrawalHelpers.revert_receive_address,
            erc20Token,
            TX_AMOUNT
        );
    });

    it('should recover multiple withdrawals', async () => {
        await tester.testRecoverMultipleWithdrawals(
            alice,
            [
                TEST_CONFIG.withdrawalHelpers.revert_receive_address,
                TEST_CONFIG.withdrawalHelpers.revert_receive_address
            ],
            ['ETH', erc20Token],
            [TX_AMOUNT, TX_AMOUNT]
        );
    });

    it.only('forced_exit_requests should recover multiple tokens', async () => {
        await tester.testForcedExitRequestOneToken(
            alice,
            bob.ethSigner,
            'ETH',
            utils.parseEther('1.0')
        )
    })
});
