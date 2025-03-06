const cron = require('node-cron');
const storiesModel = require('../../models/storiesModel');
const { Op } = require('sequelize');
const paymentModel = require('../../models/paymentModel');
const { sortAndGenerateHASH, pingAPI, parseResponse } = require('../jazzcash');

const deleteOldStories = async () => {
    try {
        const twentyFourHoursAgo = new Date(new Date() - 24 * 60 * 60 * 1000);

        // Find stories older than 24 hours
        const oldStories = await storiesModel.findAll({
            where: {
                createdAt: {
                    [Op.lt]: twentyFourHoursAgo,
                },
            },
        });

        // Delete the found stories
        for (const story of oldStories) {
            await story.destroy();
            console.log(`Deleted story with ID ${story.storyId}`);
        }

        console.log('Deletion process completed.');
    } catch (error) {
        console.error('Error deleting old stories:', error);
    }
};

const updatePayments = async () => {
    try {
        const tenMinutesAgo = new Date(new Date() - 10 * 60 * 1000);
        const pendingPayments = await paymentModel.findAll({
            where: {
                status: 'pending',
                createdAt: {
                    [Op.lt]: tenMinutesAgo,
                }
            },
        });

        let p, r;
        for (const payment of pendingPayments) {
            p = sortAndGenerateHASH({
                pp_TxnRefNo: payment.dataValues.txnReference,
                pp_MerchantID: process.env.JAZZCASH_MERCHANT_ID,
                pp_Password: process.env.JAZZCASH_PASSWORD
            });
            r = await pingAPI(process.env.JAZZCASH_STATUS_INQUIRY_URL, p);
            r = await parseResponse(r.body);
            //
            console.log('incoming status >>>>', r.pp_Status);
            if(r.pp_Status == 'Completed') {
                console.log('updating status...');
                await payment.update({status: 'success'});
                console.log('status updated.');
            }
        }
    } catch (error) {
        console.error('Error updating payments:', error);
    }
};

const startCron = () => {
    cron.schedule('0 * * * *', () => {
        deleteOldStories();
        console.log('Deleting stories every hour');
    });
    cron.schedule('*/10 * * * *', () => {
        updatePayments();
        console.log('Updating payments every 10 minutes');
    });
}
startCron()



module.exports = { deleteOldStories }
