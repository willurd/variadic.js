var firstResponse = true;

function addResponse(types, response) {
    var list = document.getElementById("responses");

    if (firstResponse) {
        list.innerHTML = "";
        firstResponse = false;
    }

    var li = document.createElement("li");
    li.setAttribute("class", types.map(function(t) { return "response-" + t; }).join(" "));
    li.appendChild(document.createTextNode(response));
    list.appendChild(li);
}

var noop = function(type) {
    return function() {
        addResponse(["noop"], "No " + type + " callback specified");
    };
};

var ajax = variadic(function(v) {
    v.string("type")
     .string("url")
     .object("data", null)
     .func("success", noop("success"))
     .func("error", noop("error"));

    v.form("type", "url", "?data", "?success", "?error");
}, function(opt, rest, form) {
    var xhr = new XMLHttpRequest();
    xhr.open(opt.type, opt.url, true);

    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4) {
            if (xhr.status == 200) {
                addResponse(["internal", "success"], "ajax-internal response for form: " + form.join(", "));
                opt.success(xhr, JSON.parse(xhr.responseText));
            } else {
                addResponse(["internal", "error"], "ajax-internal response for form: " + form.join(", "));
                opt.error(xhr);
            }
        }
    };

    xhr.send(opt.data);

    return xhr;
});

window.onload = function() {
    var url = "https://baconipsum.com/api/?type=all-meat&sentences=10&start-with-lorem=1";

    function responseFunction(type, form) {
        return function(xhr, json) {
            var sentences = json[0].split(/\s*\.\s*/);
            var sentence = sentences[Math.floor(Math.random() * (sentences.length - 1))];
            addResponse([type], form + ": " + sentence);
        };
    }

    function successFunction(form) {
        return responseFunction("success", form);
    }

    function errorFunction(form) {
        return responseFunction("error", form);
    }

    ajax("get", url);
    ajax("get", url, successFunction("form 2"));
    ajax("get", url, { get: "data" });
    ajax("get", url, { get: "data" }, successFunction("form 4"));
    ajax("get", url, successFunction("form 5"), errorFunction("form 5"));
    ajax("get", url, { get: "data" }, successFunction("form 6"), errorFunction("form 6"));
};
