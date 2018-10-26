import numpy as np
import os
import shutil
from distutils.sysconfig import get_python_lib
import argparse

from caffe2.python import core, cnn, net_drawer, workspace

# If you would like to see some really detailed initializations,
# you can change --caffe2_log_level=0 to --caffe2_log_level=-1
core.GlobalInit(['caffe2', '--caffe2_log_level=0'])
# set this where the root of caffe2 is installed
# caffe2_root = "~/caffe2/caffe2"
print("Necessities imported!")

# This section preps your image and test set in a lmdb
parser = argparse.ArgumentParser()

parser.add_argument("--input_dir", 
                type=str,
                default='input',
                help="Input directory where where training dataset and meta data are saved")
parser.add_argument("--output_dir", 
                type=str,
                default='output',
                help="Output directory where output such as logs are saved.")

args, unknown = parser.parse_known_args()
#current_folder = os.getcwd()

data_folder = args.input_dir
root_folder = args.output_dir
image_file_train = os.path.join(data_folder, "train-images-idx3-ubyte")
label_file_train = os.path.join(data_folder, "train-labels-idx1-ubyte")
image_file_test = os.path.join(data_folder, "t10k-images-idx3-ubyte")
label_file_test = os.path.join(data_folder, "t10k-labels-idx1-ubyte")

# Get the dataset if it is missing
def DownloadDataset(url, path):
    import requests, zipfile
    from io import StringIO
    import io
    print("Downloading... ", url, " to ", path)
    r = requests.get(url, stream=True)
    z = zipfile.ZipFile(io.BytesIO(r.content))
    z.extractall(path)

def GenerateDB(image, label, name):
    name = os.path.join(data_folder, name)
    print('DB: ', name)
    if not os.path.exists(name):
        sitepack = get_python_lib()
        syscall = sitepack + r"\caffe2\binaries\binaries\Release\make_mnist_db" + " --channel_first true --db lmdb --image_file " + image + " --label_file " + label + " --output_file " + name
        print("Creating database with: ", syscall)
        os.system(syscall)
    else:
        print("========Database exists already.========")

if not os.path.exists(data_folder):
    os.makedirs(data_folder)
# if not os.path.exists(label_file_train):
if not os.path.exists(os.path.join(data_folder, "mnist-train-nchw-lmdb")):
    DownloadDataset("http://download.caffe2.ai/databases/mnist-lmdb.zip", data_folder)
else:
    print("========Data has downloaded!========")
    
if os.path.exists(root_folder):
    print("Looks like you ran this before, so we need to cleanup those old files...")
    shutil.rmtree(root_folder)
    
os.makedirs(root_folder)
workspace.ResetWorkspace(root_folder)

# (Re)generate the levledb database (known to get corrupted...) 
GenerateDB(image_file_train, label_file_train, "mnist-train-nchw-lmdb")
GenerateDB(image_file_test, label_file_test, "mnist-test-nchw-lmdb")

    
print("training data folder:" + data_folder)
print("workspace root folder:" + root_folder)

# For the sake of modularity, we will separate the model to multiple different parts:
# (1) The data input part
# (2) The main computation part
# (3) The training part - adding gradient operators, update, etc.
# (4) The bookkeeping part, where we just print out statistics for inspection.

def AddInput(model, batch_size, db, db_type):
    """Adds the data input part."""
    # Load the data from a DB. Now, we store MNIST data in pixel values, so after
    # batching, this will give us data with shape [batch_size, 1, 28, 28] of data
    # type uint8, and label with shape [batch_size,] of data type int.
    data_uint8, label = model.TensorProtosDBInput(
        [], ["data_uint8", "label"], batch_size=batch_size,
        db=db, db_type=db_type)
    # Since we are going to do float computations, what we will do is to cast the
    # data to float.
    data = model.Cast(data_uint8, "data", to=core.DataType.FLOAT)
    # For better numerical stability, instead of representing data in [0, 255] range
    # we will scale them down to [0, 1]. Note that we are doing in-place computation
    # for this operator: we don't need the pre-scale data.
    data = model.Scale(data, data, scale=float(1./256))
    # Now, when computing the backward pass, we will not need the gradient computation
    # for the backward pass. StopGradient does exactly that: in the forward pass it
    # does nothing and in the backward pass all it does is to tell the gradient
    # generator "the gradient does not need to pass through me".
    data = model.StopGradient(data, data)
    return data, label

print("Input function created.")

def AddLeNetModel(model, data):
    """Adds the main LeNet model.
    
    This part is the standard LeNet model: from data to the softmax prediction.
    
    For each convolutional layer we specify dim_in - number of input channels
    and dim_out - number or output channels. Also each Conv and MaxPool layer change
    image size. For example, kernel of size 5 reduces each side of an image by 4. 
    
    While when we have kernel and stride sizes equal 2 in a MaxPool layer, it devides
    each side in half. 
    """
    # Image size: 28 x 28 -> 24 x 24
    conv1 = model.Conv(data, 'conv1', dim_in=1, dim_out=20, kernel=5)
    # Image size: 24 x 24 -> 12 x 12
    pool1 = model.MaxPool(conv1, 'pool1', kernel=2, stride=2)
    # Image size: 12 x 12 -> 8 x 8
    conv2 = model.Conv(pool1, 'conv2', dim_in=20, dim_out=50, kernel=5)
    # Image size: 8 x 8 -> 4 x 4
    pool2 = model.MaxPool(conv2, 'pool2', kernel=2, stride=2)
    # 50 * 4 * 4 stands for dim_out from previous layer multiplied by the image size
    fc3 = model.FC(pool2, 'fc3', dim_in=50 * 4 * 4, dim_out=500)
    fc3 = model.Relu(fc3, fc3)
    pred = model.FC(fc3, 'pred', 500, 10)
    softmax = model.Softmax(pred, 'softmax')
    return softmax

print("Model function created.")

def AddAccuracy(model, softmax, label):
    """Adds an accuracy op to the model"""
    accuracy = model.Accuracy([softmax, label], "accuracy")
    return accuracy
print("Accuracy function created.")

def AddTrainingOperators(model, softmax, label):
    """Adds training operators to the model."""
    xent = model.LabelCrossEntropy([softmax, label], 'xent')
    # compute the expected loss
    loss = model.AveragedLoss(xent, "loss")
    # track the accuracy of the model
    AddAccuracy(model, softmax, label)
    # use the average loss we just computed to add gradient operators to the model
    model.AddGradientOperators([loss])
    # do a simple stochastic gradient descent
    ITER = model.Iter("iter")
    # set the learning rate schedule
    LR = model.LearningRate(
        ITER, "LR", base_lr=-0.1, policy="step", stepsize=1, gamma=0.999 )
    # ONE is a constant value that is used in the gradient update. We only need
    # to create it once, so it is explicitly placed in param_init_net.
    ONE = model.param_init_net.ConstantFill([], "ONE", shape=[1], value=1.0)
    # Now, for each parameter, we do the gradient updates.
    for param in model.params:
        # Note how we get the gradient of each parameter - CNNModelHelper keeps
        # track of that.
        param_grad = model.param_to_grad[param]
        # The update is a simple weighted sum: param = param + param_grad * LR
        model.WeightedSum([param, ONE, param_grad, LR], param)
    # let's checkpoint every 20 iterations, which should probably be fine.
    # you may need to delete tutorial_files/tutorial-mnist to re-run the tutorial
    model.Checkpoint([ITER] + model.params, [],
                  db="mnist_lenet_checkpoint_%05d.lmdb",
                  db_type="lmdb", every=20)
print("Training function created.")

def AddBookkeepingOperators(model):
    """This adds a few bookkeeping operators that we can inspect later.
    
    These operators do not affect the training procedure: they only collect
    statistics and prints them to file or to logs.
    """    
    # Print basically prints out the content of the blob. to_file=1 routes the
    # printed output to a file. The file is going to be stored under
    #     root_folder/[blob name]
    model.Print('accuracy', [], to_file=1)
    model.Print('loss', [], to_file=1)
    # Summarizes the parameters. Different from Print, Summarize gives some
    # statistics of the parameter, such as mean, std, min and max.
    for param in model.params:
        model.Summarize(param, [], to_file=1)
        model.Summarize(model.param_to_grad[param], [], to_file=1)
    # Now, if we really want to be verbose, we can summarize EVERY blob
    # that the model produces; it is probably not a good idea, because that
    # is going to take time - summarization do not come for free. For this
    # demo, we will only show how to summarize the parameters and their
    # gradients.
print("Bookkeeping function created")

train_model = cnn.CNNModelHelper(order="NCHW", name="mnist_train")
data, label = AddInput(
    train_model, batch_size=64,
    db=os.path.join(data_folder, 'mnist-train-nchw-lmdb'),
    db_type='lmdb')
softmax = AddLeNetModel(train_model, data)
AddTrainingOperators(train_model, softmax, label)
AddBookkeepingOperators(train_model)

# Testing model. We will set the batch size to 100, so that the testing
# pass is 100 iterations (10,000 images in total).
# For the testing model, we need the data input part, the main LeNetModel
# part, and an accuracy part. Note that init_params is set False because
# we will be using the parameters obtained from the train model.
test_model = cnn.CNNModelHelper(
    order="NCHW", name="mnist_test", init_params=False)
data, label = AddInput(
    test_model, batch_size=64,
    db=os.path.join(data_folder, 'mnist-test-nchw-lmdb'),
    db_type='lmdb')
softmax = AddLeNetModel(test_model, data)
AddAccuracy(test_model, softmax, label)

# Deployment model. We simply need the main LeNetModel part.
deploy_model = cnn.CNNModelHelper(
    order="NCHW", name="mnist_deploy", init_params=False)
AddLeNetModel(deploy_model, "data")
# You may wonder what happens with the param_init_net part of the deploy_model.
# No, we will not use them, since during deployment time we will not randomly
# initialize the parameters, but load the parameters from the db.

print('Created training and deploy models.')

print(str(train_model.param_init_net.Proto())[:400] + '\n...')

with open(os.path.join(root_folder, "train_net.pbtxt"), 'w') as fid:
    fid.write(str(train_model.net.Proto()))
with open(os.path.join(root_folder, "train_init_net.pbtxt"), 'w') as fid:
    fid.write(str(train_model.param_init_net.Proto()))
with open(os.path.join(root_folder, "test_net.pbtxt"), 'w') as fid:
    fid.write(str(test_model.net.Proto()))
with open(os.path.join(root_folder, "test_init_net.pbtxt"), 'w') as fid:
    fid.write(str(test_model.param_init_net.Proto()))
with open(os.path.join(root_folder, "deploy_net.pbtxt"), 'w') as fid:
    fid.write(str(deploy_model.net.Proto()))
print("Protocol buffers files have been created in your root folder: "+root_folder)

# The parameter initialization network only needs to be run once.
workspace.RunNetOnce(train_model.param_init_net)
# creating the network
workspace.CreateNet(train_model.net)
# set the number of iterations and track the accuracy & loss
total_iters = 200
accuracy = np.zeros(total_iters)
loss = np.zeros(total_iters)
# Now, we will manually run the network for 200 iterations. 
for i in range(total_iters):
    workspace.RunNet(train_model.net.Proto().name)
    accuracy[i] = workspace.FetchBlob('accuracy')
    loss[i] = workspace.FetchBlob('loss')

# run a test pass on the test net
workspace.RunNetOnce(test_model.param_init_net)
workspace.CreateNet(test_model.net)
test_accuracy = np.zeros(100)
for i in range(100):
    workspace.RunNet(test_model.net.Proto().name)
    test_accuracy[i] = workspace.FetchBlob('accuracy')

print('test_accuracy: %f' % test_accuracy.mean())
